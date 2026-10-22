import assert from "node:assert/strict";
import { getEventListeners } from "node:events";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { collectAnchorLines, stripAnchorLines } from "../apps/lab-shell/app/front-feature/components/codeAnchors.ts";

// Next 서버 모듈을 Node에서 실행하되 server-only는 Next가 번들한 서버용 엔트리로 연결합니다.
const hook = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") return nextResolve("next/dist/compiled/server-only/empty.js", context);
  if (["./state", "./verify-name.server", "../../front-feature/nextjs/server-actions/verify-name.server"].includes(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const base = new URL("../apps/lab-shell/app/front-feature/nextjs/server-actions/", import.meta.url);
const [{ verifyName }, { verifyNameAction }, { requestName }, { POST }] = await Promise.all([
  import(new URL("verify-name.server.ts", base)),
  import(new URL("actions.ts", base)),
  import(new URL("request-name.ts", base)),
  import("../apps/lab-shell/app/api/server-action-demo/route.ts"),
]);
hook.deregister();

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function actionData(value) { const data = new FormData(); data.set("displayName", value); return data; }
function apiRequest(value) {
  return new Request("http://localhost/api/server-action-demo", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName: value }),
  });
}

test("API와 실제 Action 함수는 같은 이름을 정규화하고 서버가 생성한 서로 다른 확인번호·진입점을 반환한다", async () => {
  const raw = "  김   실험  ";
  const [response, action] = await Promise.all([POST(apiRequest(raw)), verifyNameAction(actionData(raw))]);
  const api = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  for (const result of [api, action]) {
    assert.equal(result.status, "success");
    assert.equal(result.normalizedName, "김 실험");
    assert.equal(result.input, "");
    assert.match(result.receipt, uuid);
  }
  assert.notEqual(api.receipt, action.receipt);
  assert.equal(api.via, "api-route");
  assert.equal(action.via, "server-action");
});

test("예상 검증 오류는 양쪽 모두 원문을 보존하며 확인번호를 발급하지 않는다", async () => {
  const raw = "  김  ";
  const [response, action] = await Promise.all([POST(apiRequest(raw)), verifyNameAction(actionData(raw))]);
  const api = await response.json();
  assert.equal(response.status, 422);
  for (const result of [api, action]) {
    assert.equal(result.status, "error");
    assert.equal(result.errorType, "validation");
    assert.equal(result.input, raw);
    assert.equal(result.receipt, null);
    assert.equal(result.normalizedName, null);
  }
});

test("서버는 문자열 타입·원문 길이·정규화한 길이를 검증하고 파일이나 숫자를 이름으로 변환하지 않는다", async () => {
  const values = [42, null, { displayName: "정상 이름" }, new File(["김실험"], "name.txt"), " ", "가".repeat(31), " ".repeat(121) + "김실험"];
  const results = await Promise.all(values.map(verifyName));
  for (const result of results) {
    assert.equal(result.status, "error");
    assert.equal(result.errorType, "validation");
    assert.equal(result.receipt, null);
    assert.ok(result.input.length <= 120);
  }
});

test("잘못된 JSON은 API의 명시적인 400 응답으로 처리한다", async () => {
  const response = await POST(new Request("http://localhost/api/server-action-demo", { method: "POST", body: "{" }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).errorType, "validation");
});

test("실제 Action 진입점은 null과 일반 객체 인자를 예외 대신 검증 오류로 처리한다", async () => {
  const results = await Promise.all([null, { displayName: "김실험" }].map(verifyNameAction));
  for (const result of results) {
    assert.equal(result.status, "error");
    assert.equal(result.errorType, "validation");
    assert.equal(result.input, "");
    assert.equal(result.receipt, null);
    assert.equal(result.via, "server-action");
  }
});

test("API 요청 helper는 JSON POST로 전달하고 422 검증 오류도 본문 그대로 돌려준다", async () => {
  const raw = "  김  ";
  const result = await requestName(raw, new AbortController().signal, {
    fetchImpl: (url, init) => {
      assert.equal(url, "/api/server-action-demo");
      assert.equal(init.method, "POST");
      assert.equal(init.cache, "no-store");
      assert.deepEqual(JSON.parse(init.body), { displayName: raw });
      return POST(new Request(new URL(url, "http://localhost"), init));
    },
  });
  assert.equal(result.errorType, "validation");
  assert.equal(result.input, raw);
});

test("전송 거절·HTTP 오류·깨진 JSON은 입력을 보존하는 전송 오류이며 남은 수신을 취소한다", async () => {
  for (const fetchResult of [() => Promise.reject(new TypeError("Failed to fetch")), () => new Response("", { status: 503 }), () => new Response("{")]) {
    const lifecycle = new AbortController();
    let signal;
    const result = await requestName(" 김  실험 ", lifecycle.signal, {
      fetchImpl: async (_url, init) => { signal = init.signal; return fetchResult(); },
    });
    assert.equal(result.errorType, "transport");
    assert.equal(result.input, " 김  실험 ");
    assert.equal(signal.aborted, true);
    assert.equal(getEventListeners(lifecycle.signal, "abort").length, 0);
  }
});

test("JSON 본문을 기다리는 동안 제한 시간이 지나도 입력을 보존하며 늦은 성공은 버린다", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let finish;
  let signal;
  const body = new Promise((resolve) => { finish = resolve; });
  const pending = requestName("김실험", new AbortController().signal, {
    timeoutMs: 20,
    fetchImpl: async (_url, init) => { signal = init.signal; return { ok: true, status: 200, json: () => body }; },
  });
  await Promise.resolve();
  t.mock.timers.tick(20);
  assert.equal(signal.aborted, true);
  finish({ status: "success", input: "" });
  const result = await pending;
  assert.equal(result.errorType, "transport");
  assert.equal(result.input, "김실험");
  assert.match(result.message, /15초/);
});

test("언마운트 뒤 늦게 온 응답은 버리고, 새 요청의 결과는 그대로 유지한다", async () => {
  let finishOld;
  const oldBody = new Promise((resolve) => { finishOld = resolve; });
  const lifecycle = new AbortController();
  const old = requestName("이전 이름", lifecycle.signal, { fetchImpl: async () => ({ ok: true, json: () => oldBody }) });
  lifecycle.abort();
  const fresh = { status: "success", input: "", normalizedName: "새 이름", receipt: "current", via: "api-route" };
  const next = await requestName("새 이름", new AbortController().signal, { fetchImpl: async () => Response.json(fresh) });
  finishOld({ ...fresh, normalizedName: "이전 이름" });
  assert.equal(await old, null);
  assert.deepEqual(next, fresh);
  assert.equal(getEventListeners(lifecycle.signal, "abort").length, 0);
});

test("실제 좌우 소스의 네 토픽이 겹치지 않고 전송·공통 검증·오류·초기화 코드를 가리킨다", async () => {
  const read = (file) => readFile(new URL(file, base), "utf8");
  const [apiForm, actionForm, request, action, validation, route, client] = await Promise.all([
    read("components/ApiNameForm.tsx"), read("components/ServerActionNameForm.tsx"), read("request-name.ts"), read("actions.ts"), read("verify-name.server.ts"),
    readFile(new URL("../apps/lab-shell/app/api/server-action-demo/route.ts", import.meta.url), "utf8"), read("ServerActionsClientPage.tsx"),
  ]);
  const codes = [
    `// components/ApiNameForm.tsx\n${apiForm}\n// request-name.ts\n${request}\n// app/api/server-action-demo/route.ts\n${route}\n// verify-name.server.ts\n${validation}`,
    `// components/ServerActionNameForm.tsx\n${actionForm}\n// actions.ts\n${action}\n// verify-name.server.ts\n${validation}`,
  ];
  const definitions = [...client.matchAll(/\{ id: "([a-z-]+)"[^\n]+left: (\[[\d, ]+\]), right: (\[[\d, ]+\])/g)];
  assert.equal(definitions.length, 4);
  for (const [side, code] of codes.entries()) {
    const anchors = collectAnchorLines(code);
    const lines = stripAnchorLines(code).split("\n");
    const selected = (key) => anchors[key].map((line) => lines[line - 1]).join("\n");
    const occupied = new Set();
    for (const definition of definitions) {
      const key = definition[1];
      assert.ok(anchors[key].length > 0);
      const fallback = JSON.parse(definition[side + 2]);
      assert.ok(fallback.length > 0 && fallback.every((line) => anchors[key].includes(line)), `${key} fallback이 실제 토픽 안의 줄을 가리켜야 합니다.`);
      for (const line of anchors[key]) {
        assert.ok(!occupied.has(line), `${key}: ${line} 줄은 다른 토픽과 겹칩니다.`);
        occupied.add(line);
      }
    }
    assert.match(selected("transport"), side === 0 ? /await fetchImpl|export async function POST/ : /"use server"|await verifyNameAction/);
    assert.match(selected("server-validation"), /await wait\(800\)/);
    assert.match(selected("server-validation"), /randomUUID\(\)/);
    assert.match(selected("pending-error"), /transportFailure/);
    assert.match(selected("input-policy"), side === 0 ? /form\.reset\(\)/ : /defaultValue=\{result\.input\}/);
  }
});
