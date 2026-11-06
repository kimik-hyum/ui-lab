"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { SurveyDraft } from "./survey-selection";
import { clearSurveyAuthIntent, getSurveyClient, readSurveyAuthIntent, signInForSurvey, submitSurvey } from "../lib/survey-client";
import { surveyErrorMessage, type SurveyAuthIntent } from "../lib/survey-auth-state";
import { fetchSurveyResponse, SURVEY_READ_ERROR, type SurveyResponse } from "../lib/survey-response";

type Callbacks = {
  onRestore: (intent: SurveyAuthIntent) => void;
  onResponse: (response: SurveyResponse | null) => void;
  onReset: () => void;
};

export function useSurveySubmission(surveyId: string, callbacks: Callbacks) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<SurveyResponse | null>(null);
  const [loadError, setLoadError] = useState("");
  const inFlight = useRef(false);
  const currentUser = useRef<User | null>(null);
  const requestVersion = useRef(0);
  const reload = useRef<() => void>(() => {});
  const restore = useEffectEvent(callbacks.onRestore);
  const loaded = useEffectEvent(callbacks.onResponse);
  const reset = useEffectEvent(callbacks.onReset);

  useEffect(() => {
    let active = true;
    let identity: string | null | undefined;
    let controller: AbortController | undefined;
    const supabase = getSurveyClient();
    function cancelRequest() { ++requestVersion.current; controller?.abort(); }
    async function synchronize(next: User | null, retry = false) {
      const id = next?.id ?? null;
      if (!active || (!retry && identity === id)) return;
      const changedAccount = identity !== undefined && identity !== id;
      identity = id;
      currentUser.current = next;
      cancelRequest();
      const version = requestVersion.current;
      controller = new AbortController();
      const signal = controller.signal;
      const isCurrent = () => active && version === requestVersion.current;
      setUser(next);
      setResponse(null);
      setLoadError("");
      setChecking(true);
      if (changedAccount) { clearSurveyAuthIntent(); setError(""); reset(); }
      const intent = !retry && readSurveyAuthIntent();
      if (intent && intent.surveyId === surveyId) {
        restore({ ...intent, draft: { ...intent.draft, ownerId: id ?? undefined } });
        if (intent.status === "success") clearSurveyAuthIntent();
        if (intent.status === "error") setError(intent.message ?? surveyErrorMessage(null));
      }
      try {
        const saved = supabase && next ? await fetchSurveyResponse(supabase, surveyId, next.id, signal) : null;
        if (isCurrent()) { setResponse(saved); loaded(saved); }
      } catch {
        if (isCurrent()) setLoadError(SURVEY_READ_ERROR);
      } finally {
        if (isCurrent()) setChecking(false);
      }
    }
    // Never return an async operation from an auth callback (the SDK holds its auth lock).
    const subscription = supabase?.auth.onAuthStateChange((_event, session) => { void synchronize(session?.user ?? null); }).data.subscription;
    void (async () => {
      try {
        const session = await supabase?.auth.getSession();
        if (active && identity === undefined) await synchronize(session?.data.session?.user ?? null);
      } catch {
        if (active) { setChecking(false); setLoadError("로그인 상태를 확인하지 못했어요. 다시 불러와주세요."); }
      }
    })();
    reload.current = () => { void synchronize(currentUser.current, true); };
    return () => { active = false; cancelRequest(); subscription?.unsubscribe(); };
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
    user, checking, busy, error, response, loadError,
    clearError: () => setError(""), reload: () => reload.current(),
    login: (draft: SurveyDraft) => run(() => signInForSurvey(surveyId, draft)),
    save: (draft: SurveyDraft, onSuccess: () => void, onLoginRequired: () => void) => run(async () => {
      const supabase = getSurveyClient();
      if (!supabase) throw new Error("로그인 연결을 준비 중입니다.");
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) {
        currentUser.current = null;
        setUser(null);
        setResponse(null);
        onLoginRequired();
        return;
      }
      const userId = data.user.id;
      if (userId !== currentUser.current?.id) throw new Error("로그인 계정이 변경됐어요. 페이지를 새로고침해주세요.");
      const version = ++requestVersion.current;
      const id = await submitSurvey(surveyId, draft);
      if (version !== requestVersion.current) return;
      const saved: SurveyResponse = { id, draft: { ...draft, reason: draft.reason.trim(), ownerId: userId }, submittedAt: null, updatedAt: null };
      setResponse(saved);
      setLoadError("");
      if (readSurveyAuthIntent()?.surveyId === surveyId) clearSurveyAuthIntent();
      onSuccess();
      // A failed read after a successful write must not be reported as a failed submission.
      try {
        const confirmed = await fetchSurveyResponse(supabase, surveyId, userId);
        if (version === requestVersion.current) {
          if (confirmed) setResponse(confirmed);
          else setLoadError(SURVEY_READ_ERROR);
        }
      } catch { if (version === requestVersion.current) setLoadError(SURVEY_READ_ERROR); }
    }),
    logout: () => run(async () => {
      const { error: logoutError } = await getSurveyClient()?.auth.signOut({ scope: "local" }) ?? {};
      if (logoutError) throw new Error("로그아웃하지 못했어요. 다시 시도해주세요.");
    }),
  };
}
