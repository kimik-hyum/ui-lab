import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { parseUpgradeLog } from "../apps/lab-shell/app/upgrade-logs/_lib/parse-upgrade-log.ts";
import { buildFileDiff } from "../apps/lab-shell/app/upgrade-logs/_lib/code-diff.ts";

const directory = new URL("../docs/upgrade-logs/", import.meta.url);
const filenames = readdirSync(directory).filter((filename) => filename.endsWith(".json"));
const filename = filenames[0];
const fixture = () => JSON.parse(readFileSync(new URL(filename, directory), "utf8"));

test("저장된 모든 로그가 화면의 데이터 계약을 만족한다", () => {
  assert.ok(filenames.length > 0);
  for (const file of filenames) {
    const log = parseUpgradeLog(JSON.parse(readFileSync(new URL(file, directory), "utf8")), file);
    assert.equal(log.id, file.slice(0, -5));
  }
});

test("실행 가능한 문서 URL과 경로 이탈을 거부한다", () => {
  const record = fixture();
  record.sources[0].url = "javascript:alert(1)";
  assert.throws(() => parseUpgradeLog(record, filename), /sources\[0\].url/);
  const other = fixture();
  assert.throws(() => parseUpgradeLog(other, "../outside.json"), /id\/filename/);
  other.changes = [{ paths: ["../../private"], reason: "검증", before: "이전", after: "이후", sourceIds: [] }];
  assert.throws(() => parseUpgradeLog(other, filename), /paths/);
});

test("존재하지 않는 공식 문서 참조를 거부한다", () => {
  const record = fixture();
  record.changes = [{ paths: ["package.json"], reason: "검증", before: "이전", after: "이후", sourceIds: ["missing"] }];
  assert.throws(() => parseUpgradeLog(record, filename), /sourceIds/);
});

test("완료 기록에는 설치 버전과 변경 근거가 있어야 한다", () => {
  const record = fixture();
  record.status = "completed";
  record.packages[0].installedAfter = null;
  assert.throws(() => parseUpgradeLog(record, filename), /completed evidence/);
  for (const pkg of record.packages) pkg.installedAfter = pkg.target;
  const changes = record.changes;
  record.changes = [];
  assert.throws(() => parseUpgradeLog(record, filename), /completed evidence/);
  record.changes = changes;
  assert.equal(parseUpgradeLog(record, filename).status, "completed");
});

test("이전 형식도 실행 보고 없이 읽고 새 형식에는 해당 필드를 허용하지 않는다", () => {
  const record = fixture();
  record.checks = [{ label: "이전 실행 보고" }];
  record.limitations = ["이전 환경 메모"];
  assert.throws(() => parseUpgradeLog(record, filename), /removed fields/);
  record.schemaVersion = 1;
  for (const change of record.changes) delete change.recommendation;
  const parsed = parseUpgradeLog(record, filename);
  assert.equal(parsed.schemaVersion, 2);
  assert.equal(parsed.changes[0].recommendation, null);
  assert.equal("checks" in parsed, false);
  assert.equal("limitations" in parsed, false);
});

test("문서 지침을 적으면 근거 문서를 연결해야 한다", () => {
  const record = fixture();
  record.changes[0].recommendation = "공식 문서에 따른 변경";
  record.changes[0].sourceIds = [];
  assert.throws(() => parseUpgradeLog(record, filename), /recommendation\/sourceIds/);
});

test("코드 발췌가 없는 이전 기록도 요약으로 읽을 수 있다", () => {
  const record = fixture();
  for (const change of record.changes) delete change.files;
  assert.deepEqual(parseUpgradeLog(record, filename).changes[0].files, []);
});

test("코드 발췌는 관련 파일과 올바른 원본 위치를 가져야 한다", () => {
  const record = fixture();
  const file = record.changes[0].files[0];
  file.path = "../../private";
  assert.throws(() => parseUpgradeLog(record, filename), /files\[0\].path/);
  file.path = record.changes[0].paths[0];
  file.excerpts[0].before.startLine = 0;
  assert.throws(() => parseUpgradeLog(record, filename), /startLine/);
  file.excerpts[0] = { before: null, after: null };
  assert.throws(() => parseUpgradeLog(record, filename), /excerpts\[0\]/);
});

test("서로 다른 줄 수의 교체와 분리된 추가를 각각 대응시킨다", () => {
  const result = buildFileDiff({ path: "sample.ts", excerpts: [{
    before: { startLine: 50, code: "same\nold\nkeep\nend" },
    after: { startLine: 50, code: "same\nnew A\nnew B\nkeep\nextra\nend" },
  }] });
  assert.equal(result.removed, 1);
  assert.equal(result.added, 3);
  assert.deepEqual(result.excerpts[0].groups, [
    { before: [2], after: [2, 3] }, { before: [], after: [5] },
  ]);
});

test("새 파일·삭제 파일·빈 줄과 줄바꿈 형식을 처리한다", () => {
  const result = buildFileDiff({ path: "sample.ts", excerpts: [
    { before: null, after: { startLine: 1, code: "first\n\nthird\n" } },
    { before: { startLine: 1, code: "old" }, after: null },
    { before: { startLine: 7, code: "same\r\n" }, after: { startLine: 7, code: "same" } },
  ] });
  assert.deepEqual(result.excerpts[0].addedLines, [1, 2, 3]);
  assert.deepEqual(result.excerpts[1].removedLines, [1]);
  assert.deepEqual(result.excerpts[2].groups, []);
});
