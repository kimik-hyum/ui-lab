import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { fetchSurveyResponse } from "../apps/lab-shell/app/lib/survey-response.ts";
import { restoreSurveyDraft, sameSurveyAnswer } from "../apps/lab-shell/app/components/survey-selection.ts";

const userId = "20000000-0000-0000-0000-000000000001";
const row = {
  id: "30000000-0000-0000-0000-000000000001", reason: "요일별 비교가 편해요.",
  submitted_at: "2026-11-06T10:00:00Z", updated_at: "2026-11-06T11:00:00Z",
  options: [{ option: { option_key: "cards" } }, { option: { option_key: "sticky" } }],
};
function client(fetch) {
  return createClient("https://survey.invalid", "public-test-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch },
  });
}
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

test("저장된 응답은 현재 설문·사용자에 한정한 GET으로 선택 키와 사유를 복원한다", async () => {
  const db = client(async (input, init) => {
    const url = new URL(input);
    assert.equal(init.method, "GET");
    assert.equal(url.pathname, "/rest/v1/survey_responses");
    assert.equal(url.searchParams.get("surveys.survey_key"), "eq.responsive-tables-inner-v1");
    assert.equal(url.searchParams.get("user_id"), `eq.${userId}`);
    assert.ok(url.searchParams.get("select").includes("option_key"));
    assert.equal(init.body, undefined);
    return json([row]);
  });
  assert.deepEqual(await fetchSurveyResponse(db, "responsive-tables-inner-v1", userId), {
    id: row.id, draft: { optionIds: ["cards", "sticky"], reason: row.reason, ownerId: userId },
    submittedAt: row.submitted_at, updatedAt: row.updated_at,
  });
});

test("응답 없음과 조회 실패를 구분하고 내부 오류를 노출하지 않는다", async () => {
  assert.equal(await fetchSurveyResponse(client(async () => json([])), "survey-v1", userId), null);
  await assert.rejects(fetchSurveyResponse(client(async () => json({ message: "internal details" }, 503)), "survey-v1", userId), (error) => {
    assert.match(error.message, /불러오지 못했어요/);
    assert.doesNotMatch(error.message, /internal details/);
    return true;
  });
});

test("관계 조회가 누락된 응답을 빈 선택으로 덮어쓰지 않는다", async () => {
  for (const options of [[], [{ option: null }]]) {
    await assert.rejects(fetchSurveyResponse(client(async () => json([{ ...row, options }])), "survey-v1", userId));
  }
});

test("화면 이탈과 계정 전환 시 진행 중인 조회를 취소할 수 있다", async () => {
  const controller = new AbortController();
  let started;
  const ready = new Promise((resolve) => { started = resolve; });
  const db = client(async (_input, { signal }) => {
    started();
    await new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true }));
  });
  const query = fetchSurveyResponse(db, "survey-v1", userId, controller.signal);
  await ready;
  controller.abort();
  await assert.rejects(query);
});

test("표시 순서 변경은 수정으로 보지 않고 선택·사유 변경은 미제출 상태로 구분한다", () => {
  const answer = { optionIds: ["sticky", "cards"], reason: "읽기 편함" };
  assert.equal(sameSurveyAnswer(answer, { optionIds: ["cards", "sticky"], reason: " 읽기 편함 " }), true);
  assert.equal(sameSurveyAnswer(answer, { ...answer, reason: "다른 사유" }), false);
  assert.equal(sameSurveyAnswer(answer, { ...answer, optionIds: ["scroll", "cards"] }), false);
  assert.equal(sameSurveyAnswer(answer, { ...answer, optionIds: [] }), false);
});


test("탭을 다시 열거나 재조회해도 같은 사용자가 수정 중인 초안을 보존한다", () => {
  const saved = { optionIds: ["cards"], reason: "저장된 이유", ownerId: userId };
  const edited = { ...saved, reason: "아직 제출하지 않은 이유", dirty: true };
  assert.deepEqual(restoreSurveyDraft(edited, saved, userId), edited);
  assert.deepEqual(restoreSurveyDraft(edited, null, userId), edited);
  assert.deepEqual(restoreSurveyDraft({ ...edited, dirty: false }, saved, userId), saved);
  const anonymous = { optionIds: ["scroll"], reason: "", dirty: true };
  assert.deepEqual(restoreSurveyDraft(anonymous, saved, userId), { ...anonymous, ownerId: userId });
});

test("수정 중이더라도 다른 계정의 초안은 복원하지 않는다", () => {
  const edited = { optionIds: ["cards"], reason: "다른 사용자의 이유", ownerId: "other-user", dirty: true };
  assert.deepEqual(restoreSurveyDraft(edited, null, userId), { optionIds: [], reason: "" });
  assert.deepEqual(restoreSurveyDraft(edited, null, null), { optionIds: [], reason: "" });
});
