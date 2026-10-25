import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { captureTargetVersions, savePerformanceHistory, toHistoryRecord } from "./performance-history.mjs";

function fixture(date = "2026-10-23T03:38:45.799Z") {
  return {
    generatedAt: date, path: "/scenarios/shopping-detail-ssr", runs: 20, warmup: 3,
    expectedText: "홈으로 이동", environment: { node: "v24.15.0" },
    targets: [{ name: "next-lab", versions: { next: "16.4.2" }, versionEvidence: { kind: "installed", reference: "installed package" }, medianMetrics: { contentReadyMs: 33.24 }, distribution: { contentReadyMs: { min: 23.01, median: 33.24, p95: 47.9 } }, checklist: { statusOk: true, expectedTextOk: true, contentReadyOk: true }, runs: [{ html: "raw report must stay local" }] }],
  };
}

test("버전 범위 대신 해당 workspace에서 resolve한 설치 버전을 기록한다", (t) => {
  const root = mkdtempSync(join(tmpdir(), "ui-lab-versions-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const app = join(root, "apps", "next-lab");
  mkdirSync(join(app, "node_modules", "next"), { recursive: true });
  mkdirSync(join(root, "node_modules", "next"), { recursive: true });
  writeFileSync(join(app, "package.json"), JSON.stringify({ dependencies: { next: "^16" } }));
  writeFileSync(join(app, "node_modules", "next", "package.json"), JSON.stringify({ name: "next", version: "16.4.2" }));
  writeFileSync(join(root, "node_modules", "next", "package.json"), JSON.stringify({ name: "next", version: "16.1.1" }));
  assert.deepEqual(captureTargetVersions(root, "next-lab").versions, { next: "16.4.2" });
});

test("다른 버전의 새 측정을 누적하고 동일 실행의 결과 변경을 거부한다", (t) => {
  const root = mkdtempSync(join(tmpdir(), "ui-lab-history-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const older = fixture("2026-05-31T09:59:08.775Z");
  older.targets[0].versions.next = "16.1.1";
  older.targets[0].renderingMode = "blocking";
  savePerformanceHistory(root, "ssr", older);
  const current = fixture();
  current.targets[0].renderingMode = "html-streaming";
  current.userAgent = "browser-request-agent";
  savePerformanceHistory(root, "ssr", current);
  savePerformanceHistory(root, "ssr", current);
  const archive = JSON.parse(readFileSync(join(root, "perf-results", "history.json")));
  assert.equal(archive.records.length, 2);
  assert.equal(archive.records[0].targets[0].versions.next, "16.4.2");
  assert.equal(archive.records[1].targets[0].versions.next, "16.1.1");
  assert.equal(archive.records[0].targets[0].renderingMode, "html-streaming");
  assert.equal(archive.records[1].targets[0].renderingMode, "blocking");
  assert.equal(archive.records[0].userAgent, "browser-request-agent");
  assert.equal(archive.records[1].userAgent, undefined);
  assert.equal(archive.records[0].targets[0].runs, undefined);
  const changed = fixture();
  changed.targets[0].medianMetrics.contentReadyMs = 1;
  assert.throws(() => savePerformanceHistory(root, "ssr", changed), /different data/);
  assert.equal(JSON.parse(readFileSync(join(root, "perf-results", "history.json"))).records[0].targets[0].medianMetrics.contentReadyMs, 33.24);
});

test("병렬 통합 측정의 SSR·Lighthouse 조건과 실행 선택을 섞지 않는다", () => {
  const source = fixture();
  const combined = { generatedAt: source.generatedAt, environment: source.environment, mode: "parallel", ssr: { path: source.path, runs: 20, warmup: 3, expectedText: "홈으로 이동" }, lighthouse: { path: "/another-scenario", runs: 5, preset: "desktop" }, targets: [{ name: "next-lab", versions: source.targets[0].versions, ssr: source.targets[0], lighthouse: { medianPerformanceScore: 96, medianRun: 3, medianMetrics: { lcpMs: 1403.2, inpMs: null } } }] };
  combined.targets[0].ssr.renderingMode = "html-streaming";
  combined.targets[0].lighthouse.renderingMode = "blocking";
  const ssr = toHistoryRecord("ssr", combined);
  const lh = toHistoryRecord("lighthouse", combined);
  assert.notEqual(ssr.id, lh.id);
  assert.equal(ssr.targets[0].renderingMode, "html-streaming");
  assert.equal(lh.targets[0].renderingMode, "blocking");
  assert.equal(ssr.mode, "parallel");
  assert.equal(ssr.path, source.path);
  assert.equal(ssr.runs, 20);
  assert.equal(lh.runs, 5);
  assert.equal(lh.path, "/another-scenario");
  assert.equal(lh.targets[0].medianRun, 3);
  assert.equal(lh.targets[0].medianMetrics.inpMs, null);
});

test("과거 버전의 복원 근거를 유지하고 미기록 버전을 현재 버전으로 채우지 않는다", () => {
  const source = fixture();
  source.targets[0].versionEvidence = { kind: "reconstructed", reference: "historical lockfile", commit: "ef08c64" };
  assert.equal(toHistoryRecord("ssr", source).targets[0].versionEvidence.kind, "reconstructed");
  delete source.targets[0].versions;
  delete source.targets[0].versionEvidence;
  const target = toHistoryRecord("ssr", source).targets[0];
  assert.deepEqual(target.versions, {});
  assert.equal(target.versionEvidence, null);
  assert.throws(() => toHistoryRecord("unknown", source), /Invalid/);
});
