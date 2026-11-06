"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { SurveyDraft } from "./survey-selection";
import { clearSurveyAuthIntent, getSurveyClient, readSurveyAuthIntent, signInForSurvey, submitSurvey } from "../lib/survey-client";
import { surveyErrorMessage, type SurveyAuthIntent } from "../lib/survey-auth-state";

export function useSurveySubmission(surveyId: string, onRestore: (intent: SurveyAuthIntent) => void) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const restore = useEffectEvent(onRestore);

  useEffect(() => {
    let active = true;
    const supabase = getSurveyClient();
    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    }).data.subscription;
    async function initialize() {
      const session = await supabase?.auth.getSession();
      if (!active) return;
      setUser(session?.data.session?.user ?? null);
      setChecking(false);
      const intent = readSurveyAuthIntent();
      if (intent?.surveyId === surveyId) {
        restore(intent);
        if (intent.status === "success") clearSurveyAuthIntent();
        if (intent.status === "error") setError(intent.message ?? surveyErrorMessage(null));
      }
    }
    void initialize().catch(() => { if (active) { setChecking(false); setError("로그인 상태를 확인하지 못했어요. 잠시 후 다시 시도해주세요."); } });
    return () => { active = false; subscription?.unsubscribe(); };
  }, [surveyId]);

  async function run(action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try { await action(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : surveyErrorMessage(null)); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return {
    user, checking, busy, error, clearError: () => setError(""),
    login: (draft: SurveyDraft) => run(() => signInForSurvey(surveyId, draft)),
    save: (draft: SurveyDraft, onSuccess: () => void, onLoginRequired: () => void) => run(async () => {
      const supabase = getSurveyClient();
      if (!supabase) throw new Error("로그인 연결을 준비 중입니다.");
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) { setUser(null); onLoginRequired(); return; }
      await submitSurvey(surveyId, draft);
      if (readSurveyAuthIntent()?.surveyId === surveyId) clearSurveyAuthIntent();
      onSuccess();
    }),
    logout: () => run(async () => {
      const { error: logoutError } = await getSurveyClient()?.auth.signOut({ scope: "local" }) ?? {};
      if (logoutError) throw new Error("로그아웃하지 못했어요. 다시 시도해주세요.");
      setUser(null);
    }),
  };
}
