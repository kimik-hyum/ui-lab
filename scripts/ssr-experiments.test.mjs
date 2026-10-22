import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

// 실행 중인 앱을 검사합니다. 서버 시작·빌드·성능 결과 저장은 하지 않습니다.
// UI_LAB_BASE_URL=https://... node --test --test-reporter=spec scripts/ssr-experiments.test.mjs
const baseUrl = new URL(process.env.UI_LAB_BASE_URL ?? "http://127.0.0.1:3003");
assert.ok(["http:", "https:"].includes(baseUrl.protocol), "UI_LAB_BASE_URL은 HTTP(S) URL이어야 합니다.");

const streamPath = "/preview-embed/features/nextjs/streaming/run";
const loadingPath = "/preview-embed/ssr/data-loading";
const articlePath = "/preview-embed/features/nextjs/rsc-vs-csc/run/rsc";
const fixture = [
  { name: "팀 요약", value: "진행 중인 작업 8개" },
  { name: "최근 활동", value: "검토 대기 중인 변경 3개" },
];

function documentMarkup(html) {
  // RSC payload의 HTML 문자열을 실제 DOM 태그로 세지 않습니다.
  // 아직 닫히지 않은 script/style도 제외하여 스트리밍 중의 오탐을 막습니다.
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, "")
    .replace(/<!--[\s\S]*?(?:-->|$)/g, "");
}

function elementTags(markup) {
  return [...markup.matchAll(/<([a-z][a-z0-9:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*?>/gi)]
    .map((match) => ({
      name: match[1].toLowerCase(),
      source: match[0],
      index: match.index,
      end: match.index + match[0].length,
      attributes: Object.fromEntries(
        [...match[0].matchAll(/\s(data-[a-z-]+)="([^"]*)"/g)].map((attribute) => [attribute[1], attribute[2]]),
      ),
    }));
}

function textContent(html) {
  return html.replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
}

async function readResponse(path) {
  const url = new URL(path, baseUrl);
  url.searchParams.set("run", randomUUID());
  const started = performance.now();
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(45_000),
    headers: {
      accept: "text/html",
      "accept-encoding": "identity",
      "cache-control": "no-cache",
      "user-agent": "Mozilla/5.0 UI-LAB-SSR-observer",
    },
  });
  assert.ok(response.body, `${url.pathname}: 응답 본문이 없습니다.`);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/i, `${url.pathname}: HTML 응답이어야 합니다.`);
  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  const stages = new Map();
  let html = "";
  let chunk = 0;

  function inspectStages() {
    for (const tag of elementTags(documentMarkup(html))) {
      const stage = tag.attributes["data-stream-stage"];
      if (stage && !stages.has(stage)) {
        stages.set(stage, { chunk, arrivedMs: Math.round(performance.now() - started) });
      }
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunk += 1;
      html += decoder.decode(value, { stream: true });
      inspectStages();
    }
    html += decoder.decode();
    inspectStages();
  } finally {
    reader.releaseLock();
  }

  const markup = documentMarkup(html);
  return { status: response.status, markup, tags: elementTags(markup), stages };
}

function requireStage(response, name) {
  const stage = response.stages.get(name);
  assert.ok(stage, `실제 HTML에 ${name} 단계가 있어야 합니다.`);
  assert.equal(response.tags.filter((tag) => tag.attributes["data-stream-stage"] === name).length, 1, `${name} 단계는 한 번만 렌더링되어야 합니다.`);
  return stage;
}

function serverTimeline(response, mode) {
  assert.equal(response.status, 200, `${mode}: HTTP 200이어야 합니다.`);
  assert.equal(response.tags.find((tag) => tag.name === "main")?.attributes["data-loading-mode"], mode);
  const tasks = response.tags.filter((tag) => tag.name === "section" && "data-task" in tag.attributes).map((tag) => {
    const end = response.markup.indexOf("</section>", tag.end);
    assert.ok(end >= 0, "서버 작업 section이 완성되어야 합니다.");
    const paragraph = response.markup.slice(tag.end, end).match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    assert.ok(paragraph, "서버 작업의 fixture 결과가 있어야 합니다.");
    const startedMs = Number(tag.attributes["data-task-start"]);
    const finishedMs = Number(tag.attributes["data-task-end"]);
    assert.ok(Number.isFinite(startedMs) && Number.isFinite(finishedMs) && startedMs >= 0 && finishedMs > startedMs, "실제 서버 작업의 양수 처리 구간이 필요합니다.");
    return { name: tag.attributes["data-task"], value: textContent(paragraph[1]), startedMs, finishedMs };
  });
  assert.equal(tasks.length, 2, "실제 HTML의 서버 작업은 2개여야 합니다.");
  assert.deepEqual(tasks.map(({ name, value }) => ({ name, value })), fixture, "양쪽은 동일한 fixture를 반환해야 합니다.");

  const elapsedTags = response.tags.filter((tag) => "data-server-elapsed" in tag.attributes);
  assert.equal(elapsedTags.length, 1, "전체 서버 처리 구간을 한 번 표시해야 합니다.");
  const elapsed = Number(elapsedTags[0].attributes["data-server-elapsed"]);
  assert.equal(elapsed, Math.max(...tasks.map((task) => task.finishedMs)), "표시된 전체 시간은 마지막 서버 작업의 종료 시각과 같아야 합니다.");
  const sum = tasks.reduce((total, task) => total + task.finishedMs - task.startedMs, 0);
  const span = elapsed - Math.min(...tasks.map((task) => task.startedMs));
  return { tasks, elapsed, sum, span };
}

test("스트리밍 HTML은 헤더 → 요약 → 활동 순서로 도착하고, 일괄 SSR은 완성된 같은 내용을 보낸다", async (t) => {
  const streaming = await readResponse(`${streamPath}/streaming?delay=1000`);
  assert.equal(streaming.status, 200);
  const shell = requireStage(streaming, "shell");
  const summary = requireStage(streaming, "summary");
  const activity = requireStage(streaming, "activity");
  assert.ok(shell.chunk < summary.chunk && summary.chunk < activity.chunk,
    "헤더·요약·활동은 서로 다른 수신 구간에 순서대로 도착해야 합니다. 서버 경계 또는 프록시 버퍼링을 확인하세요.");
  assert.deepEqual(streaming.tags.filter((tag) => "data-stream-pending" in tag.attributes).map((tag) => tag.attributes["data-stream-pending"]), ["summary", "activity"]);

  const blocking = await readResponse(`${streamPath}/blocking?delay=1000`);
  assert.equal(blocking.status, 200);
  for (const name of ["shell", "summary", "activity"]) requireStage(blocking, name);
  assert.equal(blocking.tags.filter((tag) => "data-stream-pending" in tag.attributes).length, 0, "일괄 SSR에는 영역별 대기 화면을 보내지 않습니다.");
  for (const label of ["오늘의 작업", "작업 요약", "최근 활동", "공통 카드와 간격 정리", "설치 가이드 업데이트", "키보드 탐색 개선"]) {
    assert.ok(textContent(streaming.markup).includes(label) && textContent(blocking.markup).includes(label), `양쪽 실제 HTML에 '${label}' 내용이 있어야 합니다.`);
  }
  t.diagnostic(`관찰된 HTML 도착: 헤더 ${shell.arrivedMs}ms → 요약 ${summary.arrivedMs}ms → 활동 ${activity.arrivedMs}ms (브라우저 표시 시간이 아님)`);
});

test("지원하지 않는 SSR 실행 모드는 HTTP 404를 반환한다", async () => {
  const response = await readResponse(`${streamPath}/unknown`);
  assert.equal(response.status, 404);
  // Next.js는 notFound 안내를 RSC 경계로 전송할 수 있으므로 정적 문구를 강제하지 않습니다.
  assert.equal(response.stages.size, 0, "지원하지 않는 모드는 대시보드 단계 HTML을 보내면 안 됩니다.");
});

test("순차 작업은 이어서 실행하고 병렬 작업은 겹치며, 같은 fixture와 실제 처리 구간을 표시한다", async (t) => {
  const sequential = serverTimeline(await readResponse(`${loadingPath}/sequential?delay=400`), "sequential");
  const parallel = serverTimeline(await readResponse(`${loadingPath}/parallel?delay=400`), "parallel");
  const [first, second] = sequential.tasks;
  assert.ok(second.startedMs >= first.finishedMs, "순차 실행의 두 번째 작업은 첫 번째 작업 종료 후 시작해야 합니다.");
  assert.equal(sequential.span, sequential.sum + second.startedMs - first.finishedMs, "순차 처리 구간은 두 작업의 시간과 사이 대기 구간의 합이어야 합니다.");
  const overlap = Math.min(...parallel.tasks.map((task) => task.finishedMs)) - Math.max(...parallel.tasks.map((task) => task.startedMs));
  assert.ok(overlap > 0, "병렬 작업의 실행 구간이 실제로 겹쳐야 합니다.");
  assert.equal(parallel.span, parallel.sum - overlap, "병렬 처리 구간은 겹친 시간을 중복 계산하지 않아야 합니다.");
  t.diagnostic(`서버 관찰: 순차 전체 ${sequential.elapsed}ms / 작업 합 ${sequential.sum}ms · 병렬 전체 ${parallel.elapsed}ms / 겹침 ${overlap}ms`);
});

test("RSC는 JavaScript 실행 없이 같은 아티클 본문을 서버 HTML에 포함한다", async () => {
  const api = await fetch(new URL("/api/rsc-demo?delay=0", baseUrl), { signal: AbortSignal.timeout(15_000) });
  assert.equal(api.status, 200);
  const article = await api.json();
  const started = performance.now();
  const response = await readResponse(`${articlePath}?delay=500`);
  assert.equal(response.status, 200);
  assert.ok(performance.now() - started >= 450, "데이터 지연을 브라우저 타이머가 아니라 서버 응답에서 기다려야 합니다.");
  const main = response.tags.find((tag) => tag.attributes["data-article-source"] === "server");
  assert.ok(main, "실제 문서에 서버 아티클 표시가 있어야 합니다.");
  assert.equal(main.attributes["data-article-client-fetch"], "none");
  assert.equal(main.attributes["data-server-delay"], "500");
  assert.equal(response.tags.find((tag) => tag.name === "article")?.attributes["data-article-id"], article.id);
  const text = textContent(response.markup);
  for (const value of [article.title, article.intro, ...article.sections.flatMap((section) => [section.heading, section.body])]) {
    assert.equal(typeof value, "string");
    assert.ok(text.includes(value), `API와 서버 HTML의 아티클 내용이 같아야 합니다: ${value}`);
  }
});

test("존재하지 않는 아티클은 API와 서버 문서 모두 HTTP 404로 응답한다", async () => {
  const [api, response] = await Promise.all([
    fetch(new URL("/api/rsc-demo?delay=0&article=missing", baseUrl), { signal: AbortSignal.timeout(15_000) }),
    readResponse(`${articlePath}?delay=0&article=missing`),
  ]);
  assert.equal(api.status, 404);
  assert.equal(response.status, 404);
  assert.equal(response.tags.filter((tag) => tag.name === "article" && "data-article-id" in tag.attributes).length, 0);
});
