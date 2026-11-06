import assert from "node:assert/strict";
import test from "node:test";
import { getSurveySelectionState } from "../apps/lab-shell/app/components/survey-selection.ts";

const options = ["scroll", "sticky", "cards", "stacked"];

test("단일 선택은 정확히 하나의 유효한 선택지만 완료할 수 있다", () => {
  const selection = { type: "radio" };
  assert.equal(getSurveySelectionState(selection, options, []).canComplete, false);
  assert.equal(getSurveySelectionState(selection, options, ["scroll"]).canComplete, true);
  assert.equal(getSurveySelectionState(selection, options, ["scroll", "cards"]).canComplete, false);
});

test("복수 선택은 최소 개수부터 최대 개수까지 완료할 수 있고 초과는 거부한다", () => {
  const selection = { type: "checkbox", minSelections: 2, maxSelections: 3 };
  assert.equal(getSurveySelectionState(selection, options, ["scroll"]).canComplete, false);
  assert.equal(getSurveySelectionState(selection, options, ["scroll", "cards"]).canComplete, true);
  const full = getSurveySelectionState(selection, options, options.slice(0, 3));
  assert.equal(full.canComplete, true);
  assert.equal(full.atLimit, true);
  assert.equal(getSurveySelectionState(selection, options, options).canComplete, false);
  const deselected = getSurveySelectionState(selection, options, ["scroll", "cards"]);
  assert.equal(deselected.canComplete, true);
  assert.equal(deselected.atLimit, false);
});

test("최소 개수를 생략하면 한 개부터, 최소와 최대가 같으면 정확한 개수를 요구한다", () => {
  assert.equal(getSurveySelectionState({ type: "checkbox", maxSelections: 3 }, options, ["cards"]).canComplete, true);
  const exact = { type: "checkbox", minSelections: 3, maxSelections: 3 };
  assert.equal(getSurveySelectionState(exact, options, ["scroll", "cards"]).canComplete, false);
  assert.equal(getSurveySelectionState(exact, options, options.slice(0, 3)).canComplete, true);
});

test("중복·삭제된 선택지는 개수에서 제외하고 표시 순서 변경은 선택 ID에 영향을 주지 않는다", () => {
  const selection = { type: "checkbox", minSelections: 2, maxSelections: 3 };
  const stale = getSurveySelectionState(selection, options, ["scroll", "scroll", "removed"]);
  assert.deepEqual(stale.selectedIds, ["scroll"]);
  assert.equal(stale.canComplete, false);
  const ids = ["cards", "scroll"];
  assert.deepEqual(getSurveySelectionState(selection, [...options].reverse(), ids).selectedIds, ids);
});

test("성립할 수 없는 선택 규칙과 중복 ID는 설정 오류로 처리한다", () => {
  for (const [minSelections, maxSelections] of [[0, 3], [3, 2], [1, 5], [1.5, 3]]) {
    assert.throws(() => getSurveySelectionState({ type: "checkbox", minSelections, maxSelections }, options, []));
  }
  assert.throws(() => getSurveySelectionState({ type: "radio" }, ["same", "same"], []));
});
