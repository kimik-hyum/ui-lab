"use client";

import { useActionState, useId, useRef } from "react";
import { verifyNameAction } from "../actions";
import { INITIAL_VERIFICATION, transportFailure } from "../state";
import type { VerificationState } from "../types";
import { VerificationFeedback } from "./VerificationFeedback";

export function ServerActionNameForm() {
  const inputId = useId();
  const statusId = useId();
  const submitting = useRef(false);
  // [cmp:pending-error:start]
  const [result, formAction, pending] = useActionState(async (_previous: VerificationState, formData: FormData) => {
    const value = formData.get("displayName");
    const input = typeof value === "string" ? value : "";
    try {
      // [cmp:pending-error:end]
      // [cmp:transport:start]
      return await verifyNameAction(formData);
      // [cmp:transport:end]
      // [cmp:pending-error:start]
    } catch {
      return transportFailure(input);
    } finally {
      submitting.current = false;
    }
  }, INITIAL_VERIFICATION);
  // [cmp:pending-error:end]

  return (
    <article className="mx-auto min-w-0 max-w-xl rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-800">서버 이름 확인</h3>
      <p className="mb-5 mt-2 text-sm leading-relaxed text-slate-500">Next.js가 서버 호출을 전달하고 React가 결과와 대기 상태를 연결합니다.</p>
      <form action={formAction} noValidate aria-busy={pending} onSubmit={(event) => {
        if (submitting.current) event.preventDefault();
        else submitting.current = true;
      }}>
        <label htmlFor={inputId} className="mb-2 block text-sm text-slate-700">이름 · 공백 정리 후 2~30자</label>
        {/* [cmp:input-policy:start] */}
        <input id={inputId} name="displayName" defaultValue={result.input} maxLength={120} readOnly={pending} aria-invalid={result.errorType === "validation"} aria-describedby={statusId} placeholder="예: 김  실험" className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 read-only:opacity-60" />
        {/* 성공은 빈 기본값, 오류는 입력 원문으로 React의 폼 초기화를 받습니다. */}
        {/* [cmp:input-policy:end] */}
        <button type="submit" disabled={pending} className="mt-4 min-h-11 w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "확인 중…" : "서버에서 확인"}</button>
      </form>
      <VerificationFeedback result={result} pending={pending} statusId={statusId} />
    </article>
  );
}
