import assert from "node:assert/strict";
import test from "node:test";
import { parseSurveyAuthIntent, safeSurveyReturnPath, surveyErrorMessage } from "../apps/lab-shell/app/lib/survey-auth-state.ts";

const now = 1_800_000_000_000;
const intent = {
  surveyId: "responsive-tables-inner-v1", draft: { optionIds: ["cards", "sticky"], reason: "요일별 비교" },
  returnTo: "/void-ui/responsive-tables?table=inner#responsive-tables-inner-v1-survey", createdAt: now, status: "pending",
};
const parse = (value) => parseSurveyAuthIntent(JSON.stringify(value), now);

test("OAuth 왕복 시 설문 종류, 선택 순서, 사유, 복귀 위치를 복원한다", () => {
  const restored = parse(intent);
  assert.deepEqual(restored.draft, intent.draft);
  assert.equal(restored.returnTo, intent.returnTo);
  assert.equal(restored.surveyId, intent.surveyId);
  assert.equal(parse({ ...intent, status: "success" }).status, "success");
});

test("만료·미래 시각·손상된 로그인 초안은 자동 제출에 사용하지 않는다", () => {
  assert.equal(parseSurveyAuthIntent("{broken", now), null);
  for (const change of [
    { createdAt: now - 30 * 60 * 1000 - 1 }, { createdAt: now + 1 }, { createdAt: null },
    { status: "unknown" }, { surveyId: "../../other" },
    { draft: { optionIds: [], reason: "" } }, { draft: { optionIds: ["cards", "cards"], reason: "" } },
    { draft: { optionIds: [3], reason: "" } }, { draft: { optionIds: ["cards"], reason: "가".repeat(301) } },
  ]) assert.equal(parse({ ...intent, ...change }), null);
});

test("복귀 URL로 외부 사이트나 인증 콜백을 주입할 수 없다", () => {
  for (const path of ["https://evil.example", "//evil.example", "/auth/callback", "/void-ui/../../auth/callback", "/void-ui/\\evil.example", "javascript:alert(1)", null]) {
    assert.equal(safeSurveyReturnPath(path), "/void-ui/responsive-tables");
  }
  assert.equal(parse({ ...intent, returnTo: "https://evil.example" }).returnTo, "/void-ui/responsive-tables");
});

test("제출 실패와 세션 만료는 내부 오류 대신 재시도 안내로 표시한다", () => {
  assert.match(surveyErrorMessage({ code: "PGRST301" }), /다시 로그인/);
  assert.match(surveyErrorMessage({ message: "survey_not_open" }), /응답을 받지 않는/);
  assert.match(surveyErrorMessage({ message: "survey_option_unavailable" }), /새로고침/);
  assert.doesNotMatch(surveyErrorMessage({ message: "internal secret" }), /internal secret/);
});
