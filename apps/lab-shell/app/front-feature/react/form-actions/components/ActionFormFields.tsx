'use client';

import { useId } from "react";
import { useFormStatus } from "react-dom";

export function ActionFormFields({ input }: { input: string }) {
  const inputId = useId();
  // [cmp:form-pending:start]
  // 이 컴포넌트는 반드시 상태를 읽을 <form> 내부에 렌더링합니다.
  const { pending } = useFormStatus();
  // [cmp:form-pending:end]

  return (
    <>
      <label htmlFor={inputId} className="mb-2 block text-sm text-slate-700">이름 (2~30자)</label>
      {/* [cmp:form-reset:start] */}
      <input id={inputId} name="displayName" defaultValue={input} maxLength={30} disabled={pending} placeholder="예: 김실험" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 disabled:opacity-60" />
      {/* Action이 끝나면 React가 새 기본값으로 초기화합니다. 오류 시 input은 제출한 값입니다. */}
      {/* [cmp:form-reset:end] */}
      {/* [cmp:form-pending:start] */}
      <button type="submit" disabled={pending} className="mt-4 w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "저장 중…" : "이름 저장"}</button>
      {/* [cmp:form-pending:end] */}
    </>
  );
}
