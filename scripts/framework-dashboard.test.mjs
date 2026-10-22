import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DashboardHtmlParser } from "../apps/lab-shell/app/ssr-lab/framework-dashboard/_lib/html-parser.ts";

// 이미 실행 중인 production 앱을 검사합니다. 서버 시작·빌드·벤치마크 저장은 하지 않습니다.
const shellOrigin = readOrigin("UI_LAB_BASE_URL", "http://127.0.0.1:3003");
const targets = [
  { id: "next", origin: readOrigin("UI_LAB_SSR_NEXT_ORIGIN", "http://127.0.0.1:3001") },
  { id: "react-router", origin: readOrigin("UI_LAB_SSR_REACT_ROUTER_ORIGIN", "http://127.0.0.1:3005") },
  { id: "sveltekit", origin: readOrigin("UI_LAB_SSR_SVELTEKIT_ORIGIN", "http://127.0.0.1:3002") },
  { id: "nuxt", origin: readOrigin("UI_LAB_SSR_NUXT_ORIGIN", "http://127.0.0.1:3004") },
];
const fixture = JSON.parse(readFileSync(new URL("../fixtures/dashboard-ssr.json", import.meta.url), "utf8"));
const scenarioPath = "/scenarios/dashboard-ssr";

function readOrigin(name, fallback) {
  const value = new URL(process.env[name] ?? fallback);
  assert.ok(["http:", "https:"].includes(value.protocol), `${name}: HTTP(S) 주소가 필요합니다.`);
  assert.equal(value.pathname, "/", `${name}: 경로가 없는 origin을 입력해주세요.`);
  assert.equal(value.search + value.hash + value.username + value.password, "", `${name}: query·hash·인증정보를 넣지 마세요.`);
  return value.origin;
}

async function readDocument(target, query, expected) {
  const parser = new DashboardHtmlParser(target.id, expected, fixture);
  const startedAt = performance.now();
  const response = await fetch(new URL(`${scenarioPath}${query}`, target.origin), {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
    headers: { accept: "text/html", "cache-control": "no-cache", "user-agent": "ui-lab-framework-dashboard-test" },
  });
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i, `${target.id}: HTML 응답이어야 합니다.`);
  assert.ok(response.body, `${target.id}: 응답 본문이 없습니다.`);
  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      assert.ok(bytes <= 1024 * 1024, `${target.id}: 시나리오 HTML이 1MB를 초과했습니다.`);
      parser.push(decoder.decode(value, { stream: true }), performance.now() - startedAt);
    }
    parser.push(decoder.decode(), performance.now() - startedAt);
  } finally {
    try { await reader.cancel(); } finally { reader.releaseLock(); }
  }
  return { status: response.status, ...parser.finish(), markerAt: parser.contentReadyMs };
}

async function readObserver(framework, query) {
  const response = await fetch(new URL(`/api/ssr-observer/${framework}${query}`, shellOrigin), {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
    headers: { accept: "application/json", "cache-control": "no-cache" },
  });
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/i);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  return { status: response.status, body: await response.json() };
}

for (const target of targets) {
  test(`${target.id}: alpha·empty를 초기 HTML에 렌더링하고 missing은 404`, async () => {
    for (const team of ["alpha", "empty"]) {
      const result = await readDocument(target, `?team=${team}&delay=0`, { team, delayMs: 0 });
      assert.equal(result.status, 200);
      assert.equal(result.valid, true, `${target.id}/${team}: 공통 fixture와 SSR 마커가 일치해야 합니다.`);
      assert.ok(result.html.startsWith("<main "));
      assert.ok(result.html.endsWith("</main>"));
    }
    const missing = await readDocument(target, "?team=missing&delay=0", { team: "missing", delayMs: 0 });
    assert.equal(missing.status, 404);
    assert.equal(missing.valid, false);
    assert.equal(missing.markerAt, null, "404 HTML에는 성공 완료 마커가 없어야 합니다.");
  });

  test(`${target.id}: 기본값·잘못된 지연은 400ms, 허용된 800ms는 그대로 실행`, async () => {
    for (const query of ["", "?delay=-1", "?delay=not-a-number", "?delay=999999"]) {
      const result = await readDocument(target, query, { team: "alpha", delayMs: 400 });
      assert.equal(result.status, 200);
      assert.equal(result.valid, true, `${target.id}${query}: 400ms로 정규화한 HTML이 필요합니다.`);
      assert.ok(result.contentReadyMs >= 350, `${target.id}: 서버 인공지연을 생략하거나 캐시한 응답입니다 (${result.contentReadyMs}ms).`);
    }
    const result = await readDocument(target, "?delay=800", { team: "alpha", delayMs: 800 });
    assert.equal(result.status, 200);
    assert.equal(result.valid, true);
    assert.ok(result.contentReadyMs >= 750, `${target.id}: 지정한 800ms 지연이 반영되지 않았습니다.`);
  });

  test(`observer/${target.id}: 실제 HTML·측정값·404 결과를 반환`, async () => {
    for (const team of ["alpha", "empty"]) {
      const { status, body } = await readObserver(target.id, `?team=${team}&delay=0`);
      assert.equal(status, 200);
      assert.equal(body.ok, true, JSON.stringify(body.error));
      assert.equal(body.framework, target.id);
      assert.deepEqual(body.request, { team, delayMs: 0 });
      assert.equal(body.upstreamStatus, 200);
      assert.equal(body.error, null);
      assert.equal(body.source.path, scenarioPath);
      assert.equal(body.source.renderMode, "blocking");
      assert.match(body.source.version, /^\d+\.\d+\.\d+/);
      assert.ok(Number.isFinite(Date.parse(body.observedAt)));
      const metrics = body.metrics;
      for (const key of ["responseStartMs", "firstByteMs", "contentReadyMs", "totalMs", "htmlBytes"]) {
        assert.equal(typeof metrics[key], "number", `${key}는 실제 측정 숫자여야 합니다.`);
        assert.ok(Number.isFinite(metrics[key]) && metrics[key] >= 0);
      }
      assert.ok(metrics.firstByteMs >= metrics.responseStartMs);
      assert.ok(metrics.contentReadyMs >= metrics.firstByteMs);
      assert.ok(metrics.totalMs >= metrics.contentReadyMs);
      assert.ok(metrics.htmlBytes >= Buffer.byteLength(body.html));
      const parser = new DashboardHtmlParser(target.id, { team, delayMs: 0 }, fixture);
      parser.push(body.html, 0);
      assert.equal(parser.finish().valid, true, "observer는 실제 fixture의 main을 반환해야 합니다.");
      assert.doesNotMatch(body.html, /<(?:script|style|iframe|img|link)\b|\son[a-z]+=|\s(?:src|href)=/i);
    }
    const { status, body } = await readObserver(target.id, "?team=missing&delay=0");
    assert.equal(status, 200, "관찰 API HTTP 상태와 upstream 상태를 구분합니다.");
    assert.equal(body.ok, false);
    assert.equal(body.upstreamStatus, 404);
    assert.equal(body.error.code, "not-found");
    assert.equal(body.html, null);
  });
}

test("observer API는 등록하지 않은 대상·임의 query·중복값을 거부한다", async () => {
  for (const [framework, query, code] of [
    ["unknown", "", "invalid-target"],
    ["next", "?url=http://example.com", "invalid-request"],
    ["next", "?delay=999999", "invalid-request"],
    ["next", "?delay=400&delay=0", "invalid-request"],
    ["next", "?team=alpha&team=missing", "invalid-request"],
    ["next", "?team=unknown", "invalid-request"],
  ]) {
    const { status, body } = await readObserver(framework, query);
    assert.equal(status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.error.code, code);
    assert.equal(body.upstreamStatus, null);
    assert.equal(body.html, null);
    assert.equal(body.metrics, null);
  }
});
