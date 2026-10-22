'use client';

import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { INITIAL_RESULT, saveProfile } from "../form-action";
import { FormFeedback } from "./FormFeedback";

export function ManualProfileForm({ shouldFail }: { shouldFail: boolean }) {
  const inputId = useId();
  // [cmp:form-state:start]
  const [result, setResult] = useState(INITIAL_RESULT);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  // [cmp:form-state:end]

  // [cmp:form-submit:start]
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    submitting.current = true;
    setPending(true);
    try {
      const next = await saveProfile(result, formData);
      setResult(next);
      // [cmp:form-submit:end]
      // [cmp:form-reset:start]
      if (next.status === "success") form.reset();
      // 오류는 입력을 유지하고, 성공할 때만 직접 초기화합니다.
      // [cmp:form-reset:end]
      // [cmp:form-submit:start]
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  // [cmp:form-submit:end]

  return (
    <article className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-800">프로필 이름 저장</h3>
      <p className="mb-5 mt-2 text-sm leading-relaxed text-slate-500">제출, 대기 상태, 입력 초기화를 직접 연결합니다.</p>
      <form onSubmit={handleSubmit} noValidate>
        <input type="hidden" name="shouldFail" value={String(shouldFail)} />
        <label htmlFor={inputId} className="mb-2 block text-sm text-slate-700">이름 (2~30자)</label>
        <input id={inputId} name="displayName" maxLength={30} disabled={pending} placeholder="예: 김실험" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 disabled:opacity-60" />
        {/* [cmp:form-pending:start] */}
        <button type="submit" disabled={pending} className="mt-4 w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "저장 중…" : "이름 저장"}</button>
        {/* [cmp:form-pending:end] */}
      </form>
      <FormFeedback result={result} pending={pending} />
    </article>
  );
}
