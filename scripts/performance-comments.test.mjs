import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { hasNewerCommentMeasurements, resolveCommentMeasurements } from "../apps/lab-shell/app/performance/comment-model.ts";
import { sameConditions } from "../apps/lab-shell/app/performance/history-comparison.ts";

function fixture() {
  const comment = { framework: "vue-lab", packageName: "nuxt", fromVersion: "4.4.5", toVersion: "4.6.2", scenarioPath: "/product", comparisonId: "upgrade", measurements: [{ kind: "ssr", before: "before", after: "after" }] };
  const record = (id, version, value) => ({ id, kind: "ssr", path: "/product", generatedAt: "2026-10-23T05:00:00Z", comparison: { id: "upgrade" }, targets: [{ name: "vue-lab", versions: { nuxt: version }, medianMetrics: { contentReadyMs: value } }] });
  return { comment, records: [record("before", "4.4.5", 200), record("after", "4.6.2", 240)] };
}

test("새 측정 후에도 코멘트는 분석 당시 기록을 유지하고 새 측정 여부를 구분한다", () => {
  const { comment, records } = fixture();
  assert.equal(hasNewerCommentMeasurements(comment, records), false);
  const newer = structuredClone(records[1]);
  newer.id = "newer";
  newer.generatedAt = "2026-10-23T06:00:00Z";
  newer.targets[0].medianMetrics.contentReadyMs = 100;
  const evidence = resolveCommentMeasurements(comment, [newer, ...records]);
  assert.equal(evidence[0].after.record.id, "after");
  assert.equal(evidence[0].after.target.medianMetrics.contentReadyMs, 240);
  assert.equal(hasNewerCommentMeasurements(comment, [newer, ...records]), true);
  newer.targets[0].name = "next-lab";
  assert.equal(hasNewerCommentMeasurements(comment, [newer, ...records]), false);
});

test("실행 ID가 맞아도 프레임워크·버전·검사·시나리오·비교 ID가 다르면 연결하지 않는다", () => {
  for (const mutate of [
    (record) => { record.targets[0].name = "other"; },
    (record) => { record.targets[0].versions.nuxt = "another"; },
    (record) => { record.kind = "lighthouse"; },
    (record) => { record.path = "/other"; },
    (record) => { record.comparison.id = "other"; },
  ]) {
    const { comment, records } = fixture();
    mutate(records[1]);
    assert.equal(resolveCommentMeasurements(comment, records).length, 0);
  }
  const { comment, records } = fixture();
  assert.deepEqual(resolveCommentMeasurements(comment, records.slice(0, 1)), []);
});

test("새 기준 측정은 이전 값을 만들지 않고 이후 기록에만 연결한다", () => {
  const { comment, records } = fixture();
  comment.fromVersion = comment.toVersion;
  comment.measurements[0].before = null;
  const [evidence] = resolveCommentMeasurements(comment, records.slice(1));
  assert.equal(evidence.before, null);
  assert.equal(evidence.after.record.id, "after");
  assert.equal(hasNewerCommentMeasurements(comment, records), false);
  const newer = structuredClone(records[1]);
  newer.id = "newer";
  newer.generatedAt = "2026-10-24T00:00:00Z";
  assert.equal(hasNewerCommentMeasurements(comment, [...records, newer]), true);
  records[1].comparison.id = "different";
  assert.deepEqual(resolveCommentMeasurements(comment, records), []);
});

test("문서의 모든 분석 코멘트가 실측 이력·버전·동일 조건·상세 문서에 연결된다", () => {
  const document = JSON.parse(readFileSync(new URL("../docs/harness/performance-comments.json", import.meta.url), "utf8"));
  const { records } = JSON.parse(readFileSync(new URL("../perf-results/history.json", import.meta.url), "utf8"));
  assert.equal(document.schemaVersion, 1);
  assert.equal(new Set(document.comments.map((comment) => comment.id)).size, document.comments.length);
  for (const comment of document.comments) {
    for (const key of ["id", "framework", "packageName", "fromVersion", "toVersion", "comparisonId", "scenarioPath", "versionChanges", "observation", "conclusion"]) assert.ok(comment[key]?.trim(), `${comment.id}: ${key}`);
    assert.ok(Number.isFinite(Date.parse(comment.recordedOn)));
    assert.ok(["observed", "investigating", "resolved"].includes(comment.status));
    assert.ok(["unchanged", "migration", "optimized", "rendering"].includes(comment.code.kind));
    assert.ok(comment.code.description.trim());
    assert.ok(comment.measurements.length > 0);
    assert.equal(new Set(comment.measurements.map((reference) => reference.kind)).size, comment.measurements.length);
    const evidence = resolveCommentMeasurements(comment, records);
    assert.equal(evidence.length, comment.measurements.length, `${comment.id}: broken reference`);
    for (const { before, after } of evidence) {
      assert.equal(sameConditions(before ?? after, after), true, `${comment.id}: different measurement conditions`);
      if (!before) assert.equal(comment.fromVersion, comment.toVersion, `${comment.id}: a baseline is not a version comparison`);
    }
    assert.ok(comment.sources.length > 0);
    for (const source of comment.sources) {
      assert.ok(source.title.trim());
      assert.equal(new URL(source.url).protocol, "https:");
    }
    if (comment.reportPath) {
      assert.match(comment.reportPath, /^docs\/harness\/results\/[a-z0-9.-]+\.md$/);
      assert.ok(existsSync(new URL(`../${comment.reportPath}`, import.meta.url)));
    }
  }
});
