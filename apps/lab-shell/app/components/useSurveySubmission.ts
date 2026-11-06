"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { SurveyDraft } from "./survey-selection";
import { clearSurveyAuthIntent, getSurveyClient, readSurveyAuthIntent, signInForSurvey, submitSurvey } from "../lib/survey-client";
import { isSurveySessionExpired, surveyErrorMessage, type SurveyAuthIntent } from "../lib/survey-auth-state";
import { fetchSurveyResponse, SURVEY_READ_ERROR, type SurveyResponse } from "../lib/survey-response";

type Callbacks = {
  onRestore: (intent: SurveyAuthIntent) => void;
  onResponse: (response: SurveyResponse | null, userId: string | null) => void;
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
  const mounted = useRef(false);
  const currentUser = useRef<User | null | undefined>(undefined);
  const requestVersion = useRef(0);
  const controller = useRef<AbortController | undefined>(undefined);
  const reload = useRef<() => void>(() => {});
  const synchronizeUser = useRef<(next: User | null) => Promise<void>>(async () => {});
  const restore = useEffectEvent(callbacks.onRestore);
  const loaded = useEffectEvent(callbacks.onResponse);
  const reset = useEffectEvent(callbacks.onReset);

  useEffect(() => {
    let active = true;
    mounted.current = true;
    currentUser.current = undefined;
    const supabase = getSurveyClient();
    function cancelRequest() { ++requestVersion.current; controller.current?.abort(); }
    async function synchronize(next: User | null, retry = false) {
      const id = next?.id ?? null;
      if (!active || (!retry && currentUser.current !== undefined && (currentUser.current?.id ?? null) === id)) return;
      const changedAccount = currentUser.current !== undefined && (currentUser.current?.id ?? null) !== id;
      currentUser.current = next;
      cancelRequest();
      const version = requestVersion.current;
      controller.current = new AbortController();
      const signal = controller.current.signal;
      const isCurrent = () => active && version === requestVersion.current;
      setUser(next);
      setResponse(null);
      setLoadError("");
      setChecking(true);
      const intent = !retry && readSurveyAuthIntent();
      const shouldRestore = intent && intent.surveyId === surveyId;
      if (changedAccount) { setError(""); reset(); }
      if (shouldRestore) {
        restore({ ...intent, draft: { ...intent.draft, ownerId: id ?? undefined } });
        clearSurveyAuthIntent();
        if (intent.status === "error") setError(intent.message ?? surveyErrorMessage(null));
      } else if (changedAccount) clearSurveyAuthIntent();
      try {
        const saved = supabase && next ? await fetchSurveyResponse(supabase, surveyId, next.id, signal) : null;
        if (isCurrent()) {
          setResponse(saved);
          // OAuth resumes the user's selection even when an older answer already exists.
          if (!shouldRestore) loaded(saved, id);
        }
      } catch {
        if (isCurrent()) setLoadError(SURVEY_READ_ERROR);
      } finally {
        if (isCurrent()) setChecking(false);
      }
    }
    async function readSession(retry = false) {
      const version = requestVersion.current;
      try {
        const result = await supabase?.auth.getSession();
        if (result?.error) throw result.error;
        if (active && version === requestVersion.current && (retry || currentUser.current === undefined)) {
          await synchronize(result?.data.session?.user ?? null, retry);
        }
      } catch {
        if (active && version === requestVersion.current) {
          setChecking(false);
          setLoadError("로그인 상태를 확인하지 못했어요. 다시 불러와주세요.");
        }
      }
    }
    // Never return an async operation from an auth callback (the SDK holds its auth lock).
    const subscription = supabase?.auth.onAuthStateChange((_event, session) => { void synchronize(session?.user ?? null); }).data.subscription;
    void readSession();
    synchronizeUser.current = synchronize;
    reload.current = () => { void readSession(true); };
    return () => { active = false; mounted.current = false; cancelRequest(); subscription?.unsubscribe(); };
  }, [surveyId]);

  async function run(action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try { await action(); }
    catch (reason) { if (mounted.current) setError(reason instanceof Error ? reason.message : surveyErrorMessage(null)); }
    finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }

  return {
    user, checking, busy, error, response, loadError,
    clearError: () => setError(""), reload: () => reload.current(),
    login: (draft: SurveyDraft) => run(() => signInForSurvey(surveyId, draft)),
    save: (draft: SurveyDraft, onSuccess: (answer: SurveyDraft) => void, onLoginRequired: () => void) => run(async () => {
      const supabase = getSurveyClient();
      if (!supabase) throw new Error("로그인 연결을 준비 중입니다.");
      const version = ++requestVersion.current;
      controller.current?.abort();
      const { data, error: userError } = await supabase.auth.getUser();
      if (!mounted.current) return;
      const expired = isSurveySessionExpired(userError) || (!userError && !data.user);
      if (version !== requestVersion.current) {
        // The SDK can emit SIGNED_OUT while getUser refreshes an expired session.
        if (expired && !currentUser.current) onLoginRequired();
        return;
      }
      if (expired) {
        await synchronizeUser.current(null);
        if (mounted.current && !currentUser.current) onLoginRequired();
        return;
      }
      if (userError || !data.user) throw new Error("로그인 서버에 연결하지 못했어요. 작성한 내용은 유지되니 다시 제출해주세요.");
      const userId = data.user.id;
      if (userId !== currentUser.current?.id) {
        await synchronizeUser.current(data.user);
        throw new Error("로그인 계정이 변경됐어요. 선택 내용을 다시 확인해주세요.");
      }
      const id = await submitSurvey(surveyId, draft);
      if (version !== requestVersion.current) return;
      const saved: SurveyResponse = { id, draft: { ...draft, reason: draft.reason.trim(), ownerId: userId, dirty: false }, submittedAt: null, updatedAt: null };
      setResponse(saved);
      setLoadError("");
      if (readSurveyAuthIntent()?.surveyId === surveyId) clearSurveyAuthIntent();
      onSuccess(saved.draft);
      // The write is complete. Refresh timestamps without keeping the modal locked.
      controller.current = new AbortController();
      void fetchSurveyResponse(supabase, surveyId, userId, controller.current.signal).then((confirmed) => {
        if (version === requestVersion.current) {
          if (confirmed) setResponse(confirmed);
          else setLoadError(SURVEY_READ_ERROR);
        }
      }).catch(() => { if (version === requestVersion.current) setLoadError(SURVEY_READ_ERROR); });
    }),
    logout: () => run(async () => {
      const { error: logoutError } = await getSurveyClient()?.auth.signOut({ scope: "local" }) ?? {};
      if (logoutError) throw new Error("로그아웃하지 못했어요. 다시 시도해주세요.");
    }),
  };
}
