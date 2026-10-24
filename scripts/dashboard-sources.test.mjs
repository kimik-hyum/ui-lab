import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { FRAMEWORK_SOURCE_CATALOG, SOURCE_SCOPE_IDS } from "../apps/lab-shell/app/ssr-lab/framework-dashboard/source-catalog.ts";
import { stripAnchorLines } from "../apps/lab-shell/app/front-feature/components/codeAnchors.ts";

const hook = registerHooks({ resolve(specifier, context, nextResolve) {
  if (["./presentation", "../../front-feature/components/codeAnchors"].includes(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const { dashboardSourceTopics } = await import("../apps/lab-shell/app/ssr-lab/framework-dashboard/source-topics.ts");
hook.deregister();

const root = new URL("../", import.meta.url);
const frameworks = Object.keys(FRAMEWORK_SOURCE_CATALOG);
const sources = Object.fromEntries(frameworks.map((framework) => [framework,
  Object.fromEntries(SOURCE_SCOPE_IDS.map((scope) => {
    const files = [...FRAMEWORK_SOURCE_CATALOG[framework][scope].files];
    return [scope, { files, code: files.map((file) => `// ${file}\n${readFileSync(new URL(file, root), "utf8")}`).join("\n\n") }];
  })),
]));

function highlightedText(framework, scope, topic, side = "left", records = sources) {
  const lines = stripAnchorLines(records[framework][scope].code).split("\n");
  const selected = topic[`${side}Lines`];
  assert.ok(selected.length > 0);
  assert.deepEqual(selected, [...new Set(selected)].sort((a, b) => a - b));
  for (const line of selected) assert.ok(line > 0 && line <= lines.length);
  return selected.map((line) => lines[line - 1]).join("\n");
}

test("네 프레임워크의 네 범위가 실제 소스와 의미에 맞는 세 토픽을 제공한다", () => {
  assert.deepEqual(frameworks, ["next", "react-router", "sveltekit", "nuxt"]);
  assert.deepEqual(SOURCE_SCOPE_IDS, ["entry", "data", "view", "errors"]);
  for (const framework of frameworks) {
    for (const scope of SOURCE_SCOPE_IDS) {
      const topics = dashboardSourceTopics(scope, framework, framework, sources);
      assert.equal(topics.length, 3);
      assert.equal(new Set(topics.map(({ id }) => id)).size, 3);
      const texts = topics.map((topic) => {
        assert.deepEqual(topic.leftLines, topic.rightLines);
        return highlightedText(framework, scope, topic);
      });
      if (scope === "entry") {
        assert.match(texts[1], /await/);
        assert.match(texts[2], /<DashboardSsrView/);
      } else if (scope === "data") {
        assert.match(texts[0], /400/);
        assert.match(texts[0], /delayMs > 0/);
        assert.match(texts[0], /(?:wait\(delayMs\)|setTimeout\(resolve, delayMs\))/);
        assert.match(texts[1], /activities:\s*\[\]/);
        assert.match(texts[2], /null/);
        assert.doesNotMatch(texts[2], /activities:\s*\[\]/, "없는 팀 설명은 빈 팀 처리와 다른 영역을 강조해야 합니다.");
      } else if (scope === "view") {
        assert.match(texts[0], /DashboardData/);
        assert.match(texts[1], /item\.label/);
        assert.match(texts[1], /item\.value/);
        assert.match(texts[2], /아직 기록된 활동이 없습니다/);
        assert.match(texts[2], /activities\.length/);
      } else {
        assert.deepEqual(topics.map(({ id }) => id), ["errors-not-found", "errors-exception", "errors-recovery"]);
        const expectations = {
          next: [/notFound\(\)/, /DashboardSsrError|작업 현황을 불러오지 못했습니다/, /onClick=\{retry\}/],
          "react-router": [/throw new Response.*404/, /useRouteError\(|isRouteErrorResponse\(/, /새로고침/],
          sveltekit: [/error\(404/, /작업 현황을 불러오지 못했습니다/, /page\.error/],
          nuxt: [/statusCode:\s*404/, /error\.value|throw createError/, /fatal:\s*true/],
        };
        texts.forEach((text, index) => {
          assert.match(text, expectations[framework][index]);
          assert.doesNotMatch(text, /^\/\/ apps\//m, "강조가 다른 소스 파일의 헤더를 가로지르면 안 됩니다.");
        });
        if (framework === "sveltekit" || framework === "nuxt") {
          assert.doesNotMatch(sources[framework][scope].code, /<button|onClick=|@click=/);
          assert.match(topics[2].description, /없|구현하지/);
        }
      }
    }
  }
});

test("서로 다른 좌우 소스 위에 줄이 추가되어도 모든 범위의 문장·마커 연결을 유지한다", () => {
  const offsets = Object.fromEntries(frameworks.map((framework, index) => [framework, index + 2]));
  const shifted = Object.fromEntries(frameworks.map((framework) => [framework,
    Object.fromEntries(SOURCE_SCOPE_IDS.map((scope) => [scope, { ...sources[framework][scope], code: `${"// 추가 설명\n".repeat(offsets[framework])}${sources[framework][scope].code}` }])),
  ]));
  for (const left of frameworks) for (const right of frameworks) for (const scope of SOURCE_SCOPE_IDS) {
    const before = dashboardSourceTopics(scope, left, right, sources);
    const after = dashboardSourceTopics(scope, left, right, shifted);
    before.forEach((topic, index) => {
      assert.deepEqual(after[index].leftLines, topic.leftLines.map((line) => line + offsets[left]));
      assert.deepEqual(after[index].rightLines, topic.rightLines.map((line) => line + offsets[right]));
      assert.equal(highlightedText(left, scope, after[index], "left", shifted), highlightedText(left, scope, topic));
      assert.equal(highlightedText(right, scope, after[index], "right", shifted), highlightedText(right, scope, topic, "right"));
    });
  }
});

test("오류 코드는 다른 파일에 같은 문장이 있어도 지정된 파일의 줄을 강조한다", () => {
  for (const framework of frameworks) {
    const changed = structuredClone(sources);
    const decoy = stripAnchorLines(sources[framework].errors.code).split("\n").filter((line) => !line.startsWith("// apps/")).join("\n");
    const prefix = `// unrelated-example.ts\n${decoy}\n\n`;
    const offset = prefix.split("\n").length - 1;
    changed[framework].errors.code = prefix + sources[framework].errors.code;
    const before = dashboardSourceTopics("errors", framework, framework, sources);
    const after = dashboardSourceTopics("errors", framework, framework, changed);
    before.forEach((topic, index) => {
      assert.deepEqual(after[index].leftLines, topic.leftLines.map((line) => line + offset));
      assert.deepEqual(after[index].rightLines, after[index].leftLines);
    });
  }
});

test("오류 토픽마다 앞선 토픽에 가려지지 않는 hover 진입 줄이 있다", () => {
  for (const framework of frameworks) {
    const topics = dashboardSourceTopics("errors", framework, framework, sources);
    for (const side of ["left", "right"]) {
      const earlierLines = new Set();
      for (const topic of topics) {
        const lines = topic[`${side}Lines`];
        assert.ok(lines.some((line) => !earlierLines.has(line)), `${framework} ${side} ${topic.id}: 앞선 토픽과 모든 줄이 겹치면 topics.find로 진입할 수 없습니다.`);
        lines.forEach((line) => earlierLines.add(line));
      }
    }
  }
});

for (const scope of ["data", "errors"]) test(`${scope} 문장 앵커를 찾지 못해도 유효한 fallback 줄을 남긴다`, () => {
  const changed = structuredClone(sources);
  changed.next[scope].code = "// changed implementation\nexport function loadReplacement() {}";
  const topics = dashboardSourceTopics(scope, "next", "nuxt", changed);
  for (const topic of topics) {
    assert.deepEqual(topic.leftLines, [2]);
    assert.ok(topic.rightLines.length > 0);
  }
});
