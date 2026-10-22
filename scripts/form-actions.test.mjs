import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { INITIAL_RESULT, saveProfile } from "../apps/lab-shell/app/front-feature/react/form-actions/form-action.ts";
import { collectAnchorLines, stripAnchorLines } from "../apps/lab-shell/app/front-feature/components/codeAnchors.ts";

function form(input, shouldFail = false) {
  const data = new FormData();
  data.set("displayName", input);
  data.set("shouldFail", String(shouldFail));
  return data;
}

async function submit(t, previous, input, shouldFail = false) {
  const pending = saveProfile(previous, form(input, shouldFail));
  t.mock.timers.tick(800);
  return pending;
}

test("길이 검증 실패는 제출한 앞뒤 공백까지 보존한다", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  for (const input of ["  김  ", " \t ", `  ${"가".repeat(31)}  `]) {
    const result = await submit(t, INITIAL_RESULT, input);
    assert.equal(result.status, "error");
    assert.equal(result.input, input);
    assert.equal(result.savedName, INITIAL_RESULT.savedName);
    assert.equal(result.attempts, 1);
  }
});

test("실패 모드도 정규화한 이름 대신 원문을 돌려준다", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const input = "  김 실험  ";
  const result = await submit(t, INITIAL_RESULT, input, true);
  assert.equal(result.status, "error");
  assert.equal(result.input, input);
  assert.equal(result.savedName, INITIAL_RESULT.savedName);
  assert.equal(result.attempts, 1);
});

test("성공하면 앞뒤 공백을 뺀 이름만 저장하고 입력을 비운다", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const result = await submit(t, INITIAL_RESULT, "  김 실험  ");
  assert.equal(result.status, "success");
  assert.equal(result.input, "");
  assert.equal(result.savedName, "김 실험");
  assert.equal(result.message, "‘김 실험’ 저장 완료. 입력란을 비웠어요.");
  assert.equal(result.attempts, 1);
});

test("성공 뒤 두 종류의 오류가 나도 마지막 저장 이름과 제출 횟수는 유지한다", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const success = Object.freeze(await submit(t, INITIAL_RESULT, "  이전 이름  "));
  const invalid = Object.freeze(await submit(t, success, "  김  "));
  const failed = await submit(t, invalid, "  다른 이름  ", true);
  assert.equal(success.status, "success");
  assert.equal(invalid.savedName, "이전 이름");
  assert.equal(invalid.input, "  김  ");
  assert.equal(invalid.attempts, 2);
  assert.equal(failed.savedName, "이전 이름");
  assert.equal(failed.input, "  다른 이름  ");
  assert.equal(failed.attempts, 3);
});

test("공통 처리 코드를 합쳐도 네 토픽의 진입 줄과 fallback이 실제 코드에 맞는다", async () => {
  const base = new URL("../apps/lab-shell/app/front-feature/react/form-actions/", import.meta.url);
  const [manual, action, fields, shared, client, page] = await Promise.all([
    "components/ManualProfileForm.tsx", "components/ActionProfileForm.tsx", "components/ActionFormFields.tsx",
    "form-action.ts", "FormActionsClientPage.tsx", "page.tsx",
  ].map((file) => readFile(new URL(file, base), "utf8")));
  const codes = [
    `// ManualProfileForm.tsx\n${manual}\n// 공통 함수: form-action.ts\n${shared}`,
    `// ActionProfileForm.tsx\n${action}\n// 별도 파일: ActionFormFields.tsx\n${fields}\n// 공통 함수: form-action.ts\n${shared}`,
  ];
  const definitions = [...client.matchAll(/\{ id: "([a-z-]+)"[^\n]+left: (\[[\d, ]+\]), right: (\[[\d, ]+\])/g)];
  assert.deepEqual(definitions.map((match) => match[1]), ["form-state", "form-submit", "form-pending", "form-reset"]);
  for (const [side, code] of codes.entries()) {
    const anchors = collectAnchorLines(code);
    const visible = stripAnchorLines(code).split("\n");
    const previousLines = new Set();
    for (const match of definitions) {
      const lines = anchors[match[1]];
      assert.ok(lines?.length, `${side}: ${match[1]} 앵커`);
      assert.ok(lines.some((line) => !previousLines.has(line)), `${side}: ${match[1]} 고유 hover 줄`);
      assert.deepEqual(lines, JSON.parse(match[side + 2]), `${side}: ${match[1]} fallback`);
      lines.forEach((line) => previousLines.add(line));
    }
    const reset = anchors["form-reset"].map((line) => visible[line - 1]).join("\n");
    assert.match(reset, /rawInput\.trim\(\)/);
    assert.match(reset, /input: rawInput/);
    assert.match(reset, /savedName: validatedName/);
  }
  assert.match(page, /fs\.readFile\(path\.join\(process\.cwd\(\), "app\/front-feature\/react\/form-actions\/form-action\.ts"\), "utf8"\)/);
  assert.equal((page.match(/\$\{sharedActionCode\}/g) ?? []).length, 2, "공통 실제 소스를 양쪽에 표시합니다.");
});
