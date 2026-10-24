import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { DashboardHtmlParser } from "../apps/lab-shell/app/ssr-lab/framework-dashboard/_lib/html-parser.ts";
import { isFrameworkId, parseObserverRequest } from "../apps/lab-shell/app/ssr-lab/framework-dashboard/_lib/types.ts";

// Next's extensionless TS imports are resolved explicitly when testing them in Node.
const hook = registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === "./html-parser" ? "./html-parser.ts" : specifier, context);
} });
const { MAX_HTML_BYTES, ObservationLimitError, observeResponse } = await import("../apps/lab-shell/app/ssr-lab/framework-dashboard/_lib/observe-response.ts");
hook.deregister();

const fixture = JSON.parse(readFileSync(new URL("../fixtures/dashboard-ssr.json", import.meta.url), "utf8"));
const request = { team: "alpha", delayMs: 400 };
const ready = '<p data-dashboard-ready="v1">서버에서 준비한 작업 현황</p>';
function main({ team = "alpha", framework = "next", extra = "", finish = ready } = {}) {
  const empty = team === "empty";
  return `<main class="ssr-dashboard" data-dashboard-ssr="v1" data-framework="${framework}" data-render-mode="blocking" data-team-id="${team}" data-delay-ms="400"><header><p>${empty ? "빈 팀" : fixture.team.name}</p><h1>${fixture.title}</h1></header><section>${fixture.summary.map((item) => `<div><p>${item.label}</p><strong>${empty ? 0 : item.value}</strong></div>`).join("")}</section>${empty ? "<p>아직 기록된 활동이 없습니다.</p>" : `<ol>${fixture.activities.map((item) => `<li data-activity-id="${item.id}"><h3>${item.title}</h3><p>${item.status} · ${item.owner} · ${item.time}</p></li>`).join("")}</ol>`}${extra}${finish}</main>`;
}
function parse(html, options = request) {
  const parser = new DashboardHtmlParser("next", options, fixture);
  parser.push(html, 10);
  return parser.finish();
}

test("정상 fixture와 empty fixture를 실제 main HTML에서 구분한다", () => {
  assert.equal(parse(main()).valid, true);
  assert.equal(parse(main({ team: "empty" }), { team: "empty", delayMs: 400 }).valid, true);
  assert.equal(parse(main({ team: "empty" })).valid, false);
  assert.equal(parse(main(), { team: "missing", delayMs: 400 }).valid, false);
  assert.equal(parse(main().replace(fixture.activities[0].title, "다른 작업")).valid, false);
  assert.equal(parse(main().replace('data-framework="next"', 'data-framework="nuxt"')).valid, false);
});

test("script·주석·template 안의 마커는 콘텐츠 도착으로 세지 않는다", () => {
  const parser = new DashboardHtmlParser("next", request, fixture);
  parser.push(`<html><script>self.__next_f.push(${JSON.stringify(main())})</script><!-- ${main()} --><template><template>${main()}</template>${main()}</template>`, 1);
  assert.equal(parser.contentReadyMs, null);
  const html = main();
  const end = html.indexOf("</p></main>") + 4;
  parser.push(html.slice(0, end - 1), 9);
  assert.equal(parser.contentReadyMs, null);
  parser.push(html.slice(end - 1), 27);
  assert.equal(parser.finish().contentReadyMs, 27);
});

test("모든 문자 경계에서 나뉜 tag·주석·텍스트도 같은 HTML을 추출한다", () => {
  const html = `<!-- <main fake> --><script>const x = '<main>'; </script>${main()}`;
  const parser = new DashboardHtmlParser("next", request, fixture);
  for (const character of html) parser.push(character, 30);
  assert.equal(parser.finish().html, parse(main()).html);
});

test("중복 main·완료 마커, 미완성 HTML, 위조 상태를 거부한다", () => {
  for (const html of [main() + main(), main({ finish: ready + ready }), main().slice(0, -7), main().replace('data-render-mode="blocking"', 'data-render-mode="streaming"'), main().replace('data-delay-ms="400"', 'data-delay-ms="0"'), main().replace('data-dashboard-ssr="v1"', 'data-dashboard-ssr="v2"')]) {
    assert.equal(parse(html).valid, false);
  }
  assert.equal(parse(main({ finish: `<script>${ready}</script><!--${ready}-->` })).valid, false);
});

test("RSC 스크립트, URL 자산, 이벤트 속성을 추출 HTML에서 제거한다", () => {
  const result = parse(main({ extra: '<script>self.__next_f.push([1,"payload"])</script><img src="/asset.png" onerror="alert(1)"><a href="https://outside.test">링크</a><span onclick="alert(1)" style="background:url(x)">설명</span>' }));
  assert.equal(result.valid, true);
  assert.doesNotMatch(result.html, /script|__next_f|payload|onerror|onclick|href=|src=|style=/);
  assert.match(result.html, /설명/);
});

test("바이트 중간에 나뉜 한국어도 복원하고 실제 본문 크기를 계산한다", async () => {
  const bytes = new TextEncoder().encode(main());
  let offset = 0;
  let clock = 1;
  const response = new Response(new ReadableStream({ pull(controller) {
    if (offset === bytes.length) { controller.close(); return; }
    controller.enqueue(bytes.slice(offset, offset + 7));
    offset = Math.min(offset + 7, bytes.length);
    clock += 1;
  } }));
  const result = await observeResponse(response, { framework: "next", request, fixture, startedAt: 0, responseStartMs: 1, signal: new AbortController().signal, now: () => clock });
  assert.equal(result.valid, true);
  assert.equal(result.metrics.htmlBytes, bytes.length);
  assert.ok(result.metrics.firstByteMs < result.metrics.contentReadyMs);
  assert.ok(result.metrics.contentReadyMs <= result.metrics.totalMs);
});

test("1MB를 넘는 응답은 중단하고 upstream reader를 해제한다", async () => {
  let cancelled = false;
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(MAX_HTML_BYTES + 1)); }, cancel() { cancelled = true; } });
  await assert.rejects(observeResponse(new Response(body), { framework: "next", request, fixture, startedAt: performance.now(), responseStartMs: 1, signal: new AbortController().signal }), ObservationLimitError);
  assert.equal(cancelled, true);
  assert.equal(body.locked, false);
});

test("요청 취소는 대기 중인 upstream read도 중단한다", async () => {
  let cancelled = false;
  const controller = new AbortController();
  const body = new ReadableStream({ cancel() { cancelled = true; } });
  const pending = observeResponse(new Response(body), { framework: "next", request, fixture, startedAt: performance.now(), responseStartMs: 1, signal: controller.signal });
  controller.abort(new DOMException("취소", "AbortError"));
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(cancelled, true);
  assert.equal(body.locked, false);
});

test("enum·query 허용목록으로 URL 주입과 중복값을 거부한다", () => {
  assert.equal(isFrameworkId("next"), true);
  assert.equal(isFrameworkId("http://example.com"), false);
  assert.deepEqual(parseObserverRequest(new URLSearchParams()), request);
  assert.deepEqual(parseObserverRequest(new URLSearchParams("delay=0&team=empty")), { team: "empty", delayMs: 0 });
  for (const query of ["url=http://example.com", "delay=99999", "delay=400&delay=0", "team=alpha&team=missing", "team=other", "delay=4e2", "delay=-1"]) {
    assert.equal(parseObserverRequest(new URLSearchParams(query)), null);
  }
});
