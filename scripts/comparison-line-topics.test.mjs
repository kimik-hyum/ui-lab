import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { collectAnchorLines } from "../apps/lab-shell/app/front-feature/components/codeAnchors.ts";
import { resolveLineTopic } from "../apps/lab-shell/app/front-feature/components/lineTopics.ts";

test("Optimistic의 겹치는 코드에서도 사용자가 선택한 설명을 유지한다", () => {
  const source = readFileSync(new URL("../apps/lab-shell/app/front-feature/react/optimistic/components/OptimisticList.tsx", import.meta.url), "utf8");
  const anchors = collectAnchorLines(source);
  const topics = [
    { id: "write-path", lines: anchors["optimistic-write-path"] },
    { id: "concurrency", lines: anchors["optimistic-concurrency"] },
  ];
  const shared = topics[0].lines.filter((line) => topics[1].lines.includes(line));
  assert.ok(shared.length > 0, "실제 중첩 구간을 검사해야 합니다.");
  for (const line of shared) {
    for (const selected of topics) {
      assert.equal(resolveLineTopic(topics, line, (topic) => topic.lines, selected.id)?.id, selected.id);
    }
  }
});

test("선택 범위 밖의 줄은 대응 설명을 찾고, 중첩 범위는 구체적인 설명을 우선한다", () => {
  const topics = [
    { id: "wide", lines: [1, 2, 3, 4] },
    { id: "specific", lines: [2, 3] },
    { id: "other", lines: [8, 9] },
  ];
  const original = structuredClone(topics);
  assert.equal(resolveLineTopic(topics, 2, (topic) => topic.lines, "other")?.id, "specific");
  assert.equal(resolveLineTopic(topics, 8, (topic) => topic.lines, "wide")?.id, "other");
  assert.equal(resolveLineTopic(topics, 6, (topic) => topic.lines, "wide"), undefined);
  assert.equal(resolveLineTopic([], 1, (topic) => topic.lines, null), undefined);
  assert.deepEqual(topics, original);
});

test("좌우 토픽 범위를 독립적으로 해석한다", () => {
  const topics = [
    { id: "state", leftLines: [1, 2], rightLines: [10, 11] },
    { id: "request", leftLines: [10, 11], rightLines: [1, 2] },
  ];
  assert.equal(resolveLineTopic(topics, 1, (topic) => topic.leftLines, "request")?.id, "state");
  assert.equal(resolveLineTopic(topics, 1, (topic) => topic.rightLines, "request")?.id, "request");
});
