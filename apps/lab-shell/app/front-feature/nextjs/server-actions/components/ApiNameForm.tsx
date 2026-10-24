"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { requestName } from "../request-name";
import { INITIAL_VERIFICATION } from "../state";
import { VerificationFeedback } from "./VerificationFeedback";

export function ApiNameForm() {
  const inputId = useId();
  const statusId = useId();
  // [cmp:pending-error:start]
  const [result, setResult] = useState(INITIAL_VERIFICATION);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  // [cmp:pending-error:end]

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const value = new FormData(form).get("displayName");
    const input = typeof value === "string" ? value : "";
    submitting.current = true;
    setPending(true);
    const controller = new AbortController();
    request.current = controller;
    try {
      // [cmp:transport:start]
      const next = await requestName(input, controller.signal);
      // [cmp:transport:end]
      if (!next || controller.signal.aborted) return;
      setResult(next);
      // [cmp:input-policy:start]
      if (next.status === "success") form.reset();
      // 오류 때는 사용자가 입력한 원문을 그대로 둡니다.
      // [cmp:input-policy:end]
    } finally {
      submitting.current = false;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  return (
    <article className="mx-auto min-w-0 max-w-xl rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-800">서버 이름 확인</h3>
      <p className="mb-5 mt-2 text-sm leading-relaxed text-slate-500">JSON 전송과 응답 상태를 직접 연결합니다.</p>
      <form onSubmit={submit} noValidate aria-busy={pending}>
        <label htmlFor={inputId} className="mb-2 block text-sm text-slate-700">이름 · 공백 정리 후 2~30자</label>
        <input id={inputId} name="displayName" maxLength={120} readOnly={pending} aria-invalid={result.errorType === "validation"} aria-describedby={statusId} placeholder="예: 김  실험" className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 read-only:opacity-60" />
        <button type="submit" disabled={pending} className="mt-4 min-h-11 w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "확인 중…" : "서버에서 확인"}</button>
      </form>
      <VerificationFeedback result={result} pending={pending} statusId={statusId} />
    </article>
  );
}
