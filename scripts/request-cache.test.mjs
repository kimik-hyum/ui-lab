import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { teamIds, parsePattern } from "../apps/lab-shell/app/front-feature/nextjs/request-cache/config.ts";
import { collectAnchorLines, stripAnchorLines } from "../apps/lab-shell/app/front-feature/components/codeAnchors.ts";

const directory = new URL("../apps/lab-shell/app/front-feature/nextjs/request-cache/", import.meta.url);
const base = process.env.UI_LAB_REQUEST_CACHE_BASE_URL;
if (base) assert.ok(["http:", "https:"].includes(new URL(base).protocol));
const runtime = { skip: base ? false : "production 서버 확인은 UI_LAB_REQUEST_CACHE_BASE_URL 지정 시 실행합니다." };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test("팀 조건은 문자열 ID 세 개이며 잘못된 조건은 모두 같은 팀으로 정규화한다", () => {
  assert.deepEqual(teamIds("same"), ["alpha", "alpha", "alpha"]);
  assert.deepEqual(teamIds("mixed"), ["alpha", "alpha", "beta"]);
  assert.equal(parsePattern("mixed"), "mixed");
  for (const value of [undefined, "wrong", ["mixed", "same"]]) assert.equal(parsePattern(value), "same");
});

test("양쪽 실제 helper 소스의 세 토픽과 fallback이 겹침 없이 연결된다", async () => {
  const [direct, cached, shared, wrapper, config, client, page] = await Promise.all([
    "components/DirectTeamReads.tsx", "components/CachedTeamReads.tsx", "read-team.server.ts", "cached-team.server.ts", "config.ts", "RequestCacheClientPage.tsx", "page.tsx",
  ].map((name) => readFile(new URL(name, directory), "utf8")));
  const common = `\n// 공통: config.ts\n${config}\n// 공통: read-team.server.ts\n${shared}`;
  const codes = [`// DirectTeamReads.tsx\n${direct}${common}`, `// CachedTeamReads.tsx\n${cached}\n// cached-team.server.ts\n${wrapper}${common}`];
  const topics = [...client.matchAll(/\{\s+id: "([a-z-]+)"[\s\S]*?left: (\[[\d, ]+\]),\s+right: (\[[\d, ]+\])/g)];
  assert.deepEqual(topics.map((match) => match[1]), ["shared-function", "argument-key", "execution-id"]);
  for (const [side, code] of codes.entries()) {
    const lines = collectAnchorLines(code), visible = stripAnchorLines(code).split("\n"), used = new Set();
    for (const topic of topics) {
      assert.ok(lines[topic[1]]?.length);
      assert.deepEqual(lines[topic[1]], JSON.parse(topic[side + 2]));
      assert.ok(lines[topic[1]].every((line) => !used.has(line)), `${topic[1]} 토픽 강조가 겹치지 않아야 합니다.`);
      lines[topic[1]].forEach((line) => used.add(line));
    }
    assert.match(lines["execution-id"].map((line) => visible[line - 1]).join("\n"), /executionId: randomUUID\(\)/);
  }
  assert.match(wrapper, /export const readCachedTeam = cache\(readTeam\)/);
  assert.match(page, /readFile\(path\.join\(process\.cwd\(\), "app\/front-feature\/nextjs\/request-cache\/read-team\.server\.ts"\), "utf8"\)/);
});

async function response(mode, pattern = "same") {
  const url = new URL(`/preview-embed/features/nextjs/request-cache/run/${mode}?pattern=${pattern}`, base);
  const result = await fetch(url, { cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(15_000), headers: { accept: "text/html" } });
  const html = (await result.text()).replace(/<(script|style)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  return { status: result.status, html };
}

function inspect({ status, html }, mode, pattern, expected) {
  assert.equal(status, 200);
  assert.match(html, new RegExp(`data-request-cache="v1"[^>]*data-request-cache-mode="${mode}"[^>]*data-pattern="${pattern}"`));
  assert.match(html, /<p\b[^>]*data-request-cache-ready="v1"[^>]*>[\s\S]*?<\/p>/);
  const cards = [...html.matchAll(/<li\b[^>]*data-team="([^"]+)"[^>]*data-execution-id="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g)];
  assert.deepEqual(cards.map((card) => card[1]), teamIds(pattern));
  for (const card of cards) {
    assert.match(card[2], uuid);
    assert.ok(card[3].includes(card[2]), "ID가 실제 카드 본문에도 보여야 합니다.");
    assert.ok(card[3].includes(card[1] === "alpha" ? "알파 팀" : "베타 팀"));
  }
  const ids = cards.map((card) => card[2]);
  assert.equal(new Set(ids).size, expected);
  assert.match(html, new RegExp(`data-unique-count="${expected}"`));
  return ids;
}

test("production RSC: 같은 팀은 일반 함수 3개·cache 1개의 실제 ID를 반환한다", runtime, async () => {
  inspect(await response("direct"), "direct", "same", 3);
  inspect(await response("cached"), "cached", "same", 1);
});

test("production RSC: 다른 팀은 cache 결과를 분리하고 같은 팀끼리 공유한다", runtime, async () => {
  inspect(await response("direct", "mixed"), "direct", "mixed", 3);
  const ids = inspect(await response("cached", "mixed"), "cached", "mixed", 2);
  assert.equal(ids[0], ids[1]);
  assert.notEqual(ids[1], ids[2]);
});

test("production RSC: 같은 URL의 새 문서 요청은 이전 실행 ID를 재사용하지 않는다", runtime, async () => {
  for (const mode of ["direct", "cached"]) {
    const count = mode === "direct" ? 3 : 1;
    const previous = inspect(await response(mode), mode, "same", count);
    const next = inspect(await response(mode), mode, "same", count);
    assert.ok(next.every((id) => !previous.includes(id)));
  }
});

test("production RSC: 잘못된 모드는 404이고 잘못된 팀 조건은 기본값을 사용한다", runtime, async () => {
  assert.equal((await response("unknown")).status, 404);
  inspect(await response("cached", "invalid"), "cached", "same", 1);
});
