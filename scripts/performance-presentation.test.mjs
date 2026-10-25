import assert from "node:assert/strict";
import test from "node:test";
import { rankLatest, sameConditions, timeDifference, timeValue } from "../apps/lab-shell/app/performance/history-comparison.ts";

function entry(name, value, id = "current") {
  return {
    record: {
      id, kind: "ssr", generatedAt: "2026-10-23T05:00:00Z", mode: "isolated",
      path: "/product", runs: 20, warmup: 3, preset: null, expectedText: "product",
      network: { id: "1mbps", downloadKbps: 1000 }, environment: { node: "v24.15.0" },
      comparison: { id: "upgrade", harnessSha256: "same-harness" },
    },
    target: { name, medianMetrics: { contentReadyMs: value }, checklist: { statusOk: true }, medianPerformanceScore: null },
  };
}

test("버전 전후의 절대 시간과 증감률을 계산하고 0·미측정은 나누지 않는다", () => {
  const before = entry("next", 200, "before");
  assert.deepEqual(timeDifference(entry("next", 250), before, "contentReadyMs"), { ms: 50, percent: 25 });
  assert.deepEqual(timeDifference(entry("next", 150), before, "contentReadyMs"), { ms: -50, percent: -25 });
  assert.deepEqual(timeDifference(entry("next", 200), before, "contentReadyMs"), { ms: 0, percent: 0 });
  assert.equal(timeDifference(entry("next", 250), entry("next", 0, "before"), "contentReadyMs"), null);
  for (const value of [null, undefined, NaN, Infinity, -1]) assert.equal(timeValue(entry("next", value), "contentReadyMs"), null);
});

test("네트워크·환경·시나리오·도구·실행 조건이 다른 기록은 증감 비교에서 제외한다", () => {
  const current = entry("next", 250);
  for (const change of [
    { network: { id: "unlimited" } }, { environment: { node: "v22" } },
    { path: "/other" }, { runs: 10 }, { warmup: 0 }, { mode: "parallel" },
    { comparison: { id: "another", harnessSha256: "same-harness" } },
    { comparison: { id: "upgrade", harnessSha256: "another" } },
    { measurementTool: { lighthouseVersion: "another" } },
    { userAgent: "different-request-agent" },
  ]) {
    const before = entry("next", 200, "before");
    Object.assign(before.record, change);
    assert.equal(timeDifference(current, before, "contentReadyMs"), null, JSON.stringify(change));
  }
  assert.equal(timeDifference(current, entry("nuxt", 200, "before"), "contentReadyMs"), null);
  const failed = entry("next", 1);
  failed.target.checklist.statusOk = false;
  assert.equal(sameConditions(current, failed), false);
});

test("최신 버전만 낮은 시간순으로 정렬하고 미측정·다른 조건은 순위에 넣지 않는다", () => {
  const framework = (name, value) => ({ name, versions: [
    { version: "2.0", measurements: { ssr: [entry(name, value)], lighthouse: [] } },
    { version: "1.0", measurements: { ssr: [entry(name, 1, "before")], lighthouse: [] } },
  ] });
  const list = [framework("nuxt", 330), framework("next", 240), framework("svelte", null), framework("router", 280)];
  const mismatch = framework("other", 10);
  mismatch.versions[0].measurements.ssr[0].record.id = "other-run";
  mismatch.versions[0].measurements.ssr[0].record.network = { id: "unlimited" };
  list.push(mismatch);
  const ranking = rankLatest(list, "ssr", "contentReadyMs");
  assert.deepEqual(ranking.rows.map(({ name, value }) => [name, value]), [["next", 240], ["router", 280], ["nuxt", 330]]);
  assert.equal(ranking.excluded, 2);
  assert.equal(list[0].name, "nuxt");
  assert.deepEqual(rankLatest(list, "lighthouse", "lcpMs").rows, []);
});

test("같은 실행이어도 응답 방식이 다르면 같은 조건으로 취급하지 않는다", () => {
  const blocking = entry("next", 250);
  blocking.target.renderingMode = "blocking";
  const streaming = structuredClone(blocking);
  streaming.target.renderingMode = "html-streaming";
  assert.equal(sameConditions(blocking, streaming), false);
  assert.equal(timeDifference(blocking, streaming, "contentReadyMs"), null);
  streaming.target.renderingMode = "blocking";
  assert.equal(sameConditions(blocking, streaming), true);
  delete streaming.target.renderingMode;
  assert.equal(sameConditions(blocking, streaming), false);
});
