import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { parseRun } from "../apps/lab-shell/app/front-feature/nextjs/client-prerender/config.ts";
import { collectAnchorLines, stripAnchorLines } from "../apps/lab-shell/app/front-feature/components/codeAnchors.ts";

const directory = new URL("../apps/lab-shell/app/front-feature/nextjs/client-prerender/", import.meta.url);
const base = process.env.UI_LAB_CLIENT_PRERENDER_BASE_URL;
if (base) assert.ok(["http:", "https:"].includes(new URL(base).protocol));
const runtime = { skip: base ? false : "production HTML 검사는 UI_LAB_CLIENT_PRERENDER_BASE_URL 지정 시 실행합니다." };

test("문서 회차는 단일 정수 문자열만 허용하고 잘못된 값은 0으로 정규화한다", () => {
  for (const value of ["0", "1", "21", "999999999"]) assert.equal(parseRun(value), value);
  for (const value of [undefined, "-1", "01", "1.5", "1000000000", "<script>", ["1", "2"]]) {
    assert.equal(parseRun(value), "0");
  }
});

test("동일 카운터 실제 소스를 공유하고 세 토픽은 정확한 fallback과 고유 강조 줄을 가진다", async () => {
  const [left, right, counter, placeholder, client, page] = await Promise.all([
    "components/PrerenderedCounter.tsx", "components/ClientOnlyCounter.tsx", "components/Counter.tsx",
    "components/CounterPlaceholder.tsx", "ClientPrerenderClientPage.tsx", "page.tsx",
  ].map((name) => readFile(new URL(name, directory), "utf8")));
  const common = `\n// 공통: Counter.tsx\n${counter}`;
  const codes = [
    `// PrerenderedCounter.tsx\n${left}${common}`,
    `// ClientOnlyCounter.tsx\n${right}${common}\n// CounterPlaceholder.tsx\n${placeholder}`,
  ];
  const topics = [...client.matchAll(/\{\s+id: "([a-z-]+)"[\s\S]*?left: (\[[\d, ]+\]),\s+right: (\[[\d, ]+\])/g)];
  assert.deepEqual(topics.map((match) => match[1]), ["client-boundary", "initial-output", "interaction"]);
  for (const [side, code] of codes.entries()) {
    const anchors = collectAnchorLines(code), visible = stripAnchorLines(code).split("\n"), used = new Set();
    for (const topic of topics) {
      assert.ok(anchors[topic[1]]?.length);
      assert.deepEqual(anchors[topic[1]], JSON.parse(topic[side + 2]));
      assert.ok(anchors[topic[1]].every((line) => !used.has(line)), `${topic[1]} 토픽이 다른 토픽에 가려지면 안 됩니다.`);
      anchors[topic[1]].forEach((line) => used.add(line));
    }
    const interaction = anchors.interaction.map((line) => visible[line - 1]).join("\n");
    assert.match(interaction, /useState\(0\)/);
    assert.match(interaction, /onClick=\{\(\) => setCount\(\(value\) => value \+ 1\)\}/);
    assert.match(visible[anchors["client-boundary"][0] - 1], /"use client"/);
  }
  assert.match(left, /import Counter from "\.\/Counter"/);
  assert.match(right, /dynamic\(\(\) => import\("\.\/Counter"\), \{\s+ssr: false,\s+loading: CounterPlaceholder/);
  assert.doesNotMatch(counter, /\bdisabled\b|\buseEffect\b|typeof window/);
  for (const name of ["PrerenderedCounter", "ClientOnlyCounter", "Counter", "CounterPlaceholder"]) {
    assert.ok(page.includes(`readFile(path.join(process.cwd(), "app/front-feature/nextjs/client-prerender/components/${name}.tsx"), "utf8")`));
  }
});

async function response(kind, query = "run=7") {
  const url = new URL(`/preview-embed/features/nextjs/client-prerender/run/${kind}?${query}`, base);
  const result = await fetch(url, {
    cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(15_000), headers: { accept: "text/html" },
  });
  const html = (await result.text())
    .replace(/<(script|style)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  return { status: result.status, html };
}

function inspectDocument({ status, html }, kind, run = "7") {
  assert.equal(status, 200);
  const main = html.match(/<main\b[^>]*data-client-prerender="v1"[^>]*>[\s\S]*?<\/main>/)?.[0];
  assert.ok(main, "RSC script가 아닌 실제 main 요소가 있어야 합니다.");
  assert.match(main, new RegExp(`data-render-kind="${kind}"`));
  assert.match(main, new RegExp(`data-run="${run}"`));
  assert.match(main, /<p\b[^>]*data-client-prerender-ready="v1"[^>]*>[\s\S]*?<\/p>/);
  return main;
}

test("production HTML: 기본 Client Component는 카운트 0과 실제 버튼을 서버에서 출력한다", runtime, async () => {
  const main = inspectDocument(await response("prerender"), "prerender");
  assert.match(main, /<section\b[^>]*data-counter="v1"/);
  assert.match(main, /<output\b[^>]*data-counter-value[^>]*>\s*0\s*<\/output>/);
  assert.match(main, /<button\b[^>]*type="button"[^>]*data-counter-increment[^>]*>\s*카운트 \+1\s*<\/button>/);
  assert.doesNotMatch(main, /data-counter-placeholder/);
});

test("production HTML: ssr false는 같은 문서에 대체 표시만 출력하고 카운터 버튼은 출력하지 않는다", runtime, async () => {
  const main = inspectDocument(await response("client-only"), "client-only");
  assert.match(main, /<p\b[^>]*data-counter-placeholder="v1"[^>]*>\s*카운터를 불러오는 중…\s*<\/p>/);
  assert.doesNotMatch(main, /data-counter="v1"|data-counter-value|data-counter-increment/);
});

test("production HTML: 잘못된 방식은 404이며 중복 회차는 0으로 정규화한다", runtime, async () => {
  assert.equal((await response("unknown")).status, 404);
  inspectDocument(await response("prerender", "run=1&run=2"), "prerender", "0");
});
