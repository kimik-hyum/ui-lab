import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
import { SURVEY_AUTH_STORAGE_KEY } from "../apps/lab-shell/app/lib/survey-auth-state.ts";

const hook = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === "./survey-auth-state" && context.parentURL?.includes("/app/lib/survey-client.ts")) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
} });
const { completeSurveySignIn, getSurveyClient, submitSurvey } = await import("../apps/lab-shell/app/lib/survey-client.ts");
hook.deregister();

test("OAuth 콜백은 한 번만 인증하고 사유 입력을 재개하며 명시적 제출 전에는 저장하지 않는다", async (t) => {
  const oldWindow = globalThis.window;
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const oldKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://survey.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-test-key";
  const storage = new Map();
  const returnTo = "/void-ui/responsive-tables?table=inner#responsive-tables-inner-v1-survey";
  const draft = { optionIds: ["cards", "sticky"], reason: "", dirty: true };
  storage.set(SURVEY_AUTH_STORAGE_KEY, JSON.stringify({ surveyId: "responsive-tables-inner-v1", draft, returnTo, status: "pending", createdAt: Date.now() }));
  globalThis.window = {
    sessionStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
    location: { search: "?code=one-use-test-code", hash: "" },
    history: { replaceState() {} },
  };
  const client = getSurveyClient();
  t.after(async () => {
    await client.auth.stopAutoRefresh();
    globalThis.window = oldWindow;
    if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = oldKey;
  });
  const exchange = t.mock.method(client.auth, "exchangeCodeForSession", async (code) => {
    assert.equal(code, "one-use-test-code");
    return { data: { session: { user: { id: "test-user" } } }, error: null };
  });
  const rpc = t.mock.method(client, "rpc", async () => ({ data: "response-id", error: null }));
  assert.deepEqual(await Promise.all([completeSurveySignIn(), completeSurveySignIn()]), [returnTo, returnTo]);
  assert.equal(exchange.mock.callCount(), 1);
  assert.equal(rpc.mock.callCount(), 0);
  const intent = JSON.parse(storage.get(SURVEY_AUTH_STORAGE_KEY));
  assert.equal(intent.status, "ready");
  assert.deepEqual(intent.draft, draft);
  // Editing and submitting later uses the same RPC without UI-only metadata.
  await submitSurvey(intent.surveyId, { ...draft, reason: "로그인 후 작성한 이유", ownerId: "test-user" });
  assert.equal(rpc.mock.callCount(), 1);
  assert.deepEqual(rpc.mock.calls[0].arguments, ["submit_survey_response", {
    p_survey_key: intent.surveyId, p_option_keys: draft.optionIds, p_reason: "로그인 후 작성한 이유",
  }]);
});
