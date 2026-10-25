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

test("최신 버전의 다른 조건 기록도 표시하고 미측정·다른 시나리오는 제외한다", () => {
  const framework = (name, value) => ({ name, versions: [
    { version: "2.0", measurements: { ssr: [entry(name, value)], lighthouse: [] } },
    { version: "1.0", measurements: { ssr: [entry(name, 1, "before")], lighthouse: [] } },
  ] });
  const list = [framework("nuxt", 330), framework("next", 240), framework("svelte", null), framework("router", 280)];
  const mismatch = framework("other", 10);
  mismatch.versions[0].measurements.ssr[0].record.id = "other-run";
  mismatch.versions[0].measurements.ssr[0].record.network = { id: "unlimited" };
  list.push(mismatch);
  const differentScenario = framework("different-scenario", 5);
  differentScenario.versions[0].measurements.ssr[0].record.path = "/another-product";
  list.push(differentScenario);
  const ranking = rankLatest(list, "ssr", "contentReadyMs");
  assert.deepEqual(ranking.rows.map(({ name, value }) => [name, value]), [["other", 10], ["next", 240], ["router", 280], ["nuxt", 330]]);
  assert.equal(ranking.excluded, 2);
  assert.equal(ranking.mixedConditions, true);
  assert.equal(list[0].name, "nuxt");
  assert.deepEqual(rankLatest(list, "lighthouse", "lcpMs").rows, []);
});

test("Next 단독 재측정 후에도 세 프레임워크의 기존 LCP와 측정 조건을 그대로 보여준다", () => {
  const frameworks = ["next", "router", "svelte", "nuxt"].map((name, i) => {
    const measured = entry(name, 0, i === 0 ? "next-blocking" : "previous-upgrade");
    measured.record.kind = "lighthouse";
    measured.record.runs = 5;
    measured.target.medianPerformanceScore = 90;
    measured.target.medianMetrics = { lcpMs: 2000 + i * 100 };
    if (i === 0) {
      measured.record.generatedAt = "2026-10-25T00:51:30Z";
      measured.record.environment.node = "v24.22.1";
      measured.record.comparison = { id: "blocking", harnessSha256: "new-harness" };
      measured.target.renderingMode = "blocking";
    }
    return { name, versions: [{ version: "2.0", measurements: { ssr: [], lighthouse: [measured] } }] };
  });
  const unchanged = structuredClone(frameworks);
  const chart = rankLatest(frameworks, "lighthouse", "lcpMs");
  assert.deepEqual(chart.rows.map(({ name, value }) => [name, value]), [["next", 2000], ["router", 2100], ["svelte", 2200], ["nuxt", 2300]]);
  assert.equal(chart.excluded, 0);
  assert.equal(chart.mixedConditions, true);
  assert.equal(chart.record.id, "next-blocking");
  assert.equal(chart.rows[1].entry.record.environment.node, "v24.15.0");
  assert.equal(sameConditions(chart.rows[0].entry, chart.rows[1].entry), false);
  assert.deepEqual(frameworks, unchanged);
  assert.equal(rankLatest(frameworks.slice(1), "lighthouse", "lcpMs").mixedConditions, false);
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
