"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SurveyDraft } from "../components/survey-selection";
import { DEFAULT_SURVEY_PATH, SURVEY_AUTH_STORAGE_KEY, parseSurveyAuthIntent, safeSurveyReturnPath, surveyErrorMessage, type SurveyAuthIntent } from "./survey-auth-state";

let client: SupabaseClient | null = null;

export function getSurveyClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || typeof window === "undefined") return null;
  // Survey authentication is client-only and scoped to the current browser tab.
  // The database RPC and RLS remain the authority for every read and write.
  client ??= createClient(url, key, { auth: {
    flowType: "pkce", detectSessionInUrl: false, storage: window.sessionStorage,
    storageKey: "ui-lab:survey-session", persistSession: true, autoRefreshToken: true,
  } });
  return client;
}

export function readSurveyAuthIntent() {
  try { return parseSurveyAuthIntent(window.sessionStorage.getItem(SURVEY_AUTH_STORAGE_KEY)); }
  catch { return null; }
}

export function clearSurveyAuthIntent() {
  try { window.sessionStorage.removeItem(SURVEY_AUTH_STORAGE_KEY); } catch { /* A successful save must remain successful if storage becomes unavailable. */ }
}

function writeIntent(intent: SurveyAuthIntent) {
  window.sessionStorage.setItem(SURVEY_AUTH_STORAGE_KEY, JSON.stringify(intent));
}

export async function submitSurvey(surveyId: string, draft: SurveyDraft) {
  const supabase = getSurveyClient();
  if (!supabase) throw new Error("로그인 연결을 준비 중입니다. 잠시 후 다시 시도해주세요.");
  const { data, error } = await supabase.rpc("submit_survey_response", {
    p_survey_key: surveyId, p_option_keys: draft.optionIds, p_reason: draft.reason,
  });
  if (error) throw new Error(surveyErrorMessage(error));
  if (typeof data !== "string") throw new Error("저장 결과를 확인하지 못했어요. 다시 제출해주세요.");
  return data;
}

export async function signInForSurvey(surveyId: string, draft: SurveyDraft) {
  const supabase = getSurveyClient();
  if (!supabase) throw new Error("로그인 연결을 준비 중입니다. 잠시 후 다시 시도해주세요.");
  try {
    writeIntent({ surveyId, draft, createdAt: Date.now(), status: "pending",
      returnTo: safeSurveyReturnPath(`${window.location.pathname}${window.location.search}#${surveyId}-survey`),
    });
  } catch { throw new Error("이 탭에서 작성한 내용을 보관할 수 없어요. 브라우저 저장소를 허용한 뒤 다시 시도해주세요."); }
  // Check provider availability before leaving the page, so configuration errors
  // do not strand the visitor on an Auth JSON error response.
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("로그인 서버에 연결하지 못했어요. 다시 시도해주세요.");
  const settings = await response.json();
  if (!settings.external?.google) throw new Error("Google 로그인을 준비 중입니다. 작성한 의견은 그대로 유지됩니다.");
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: {
    redirectTo: `${window.location.origin}/auth/callback`, skipBrowserRedirect: true,
    queryParams: { prompt: "select_account" },
  } });
  if (error || !data.url) throw new Error("Google 로그인 페이지를 열지 못했어요. 다시 시도해주세요.");
  window.location.assign(data.url);
}

let completion: Promise<string> | undefined;

export function completeSurveySignIn() {
  // React Strict Mode may mount the callback twice; exchange a one-use code once.
  completion ??= (async () => {
    const intent = readSurveyAuthIntent();
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const code = params.get("code");
    const providerError = params.get("error") ?? hash.get("error");
    window.history.replaceState(null, "", "/auth/callback");
    if (!intent) throw new Error("로그인 요청이 만료됐어요. 설문으로 돌아가 다시 로그인해주세요.");
    if (intent.status !== "pending") return intent.returnTo;
    try {
      if (providerError) throw new Error("Google 로그인이 취소되었거나 완료되지 않았어요. 다시 시도할 수 있습니다.");
      if (!code) throw new Error("로그인 정보를 확인하지 못했어요. 다시 로그인해주세요.");
      const supabase = getSurveyClient();
      if (!supabase) throw new Error("로그인 연결을 준비 중입니다.");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session) throw new Error("로그인 요청이 만료됐거나 다른 창에서 시작됐어요. 같은 창에서 다시 로그인해주세요.");
      await submitSurvey(intent.surveyId, intent.draft);
      writeIntent({ ...intent, status: "success" });
    } catch (error) {
      writeIntent({ ...intent, status: "error", message: error instanceof Error ? error.message : surveyErrorMessage(null) });
    }
    return intent.returnTo || DEFAULT_SURVEY_PATH;
  })();
  return completion;
}
