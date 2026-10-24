'use client';

import { useActionState } from "react";
import { INITIAL_RESULT, saveProfile } from "../form-action";
import { ActionFormFields } from "./ActionFormFields";
import { FormFeedback } from "./FormFeedback";

export function ActionProfileForm({ shouldFail }: { shouldFail: boolean }) {
  // [cmp:form-state:start]
  const [result, formAction, pending] = useActionState(saveProfile, INITIAL_RESULT);
  // [cmp:form-state:end]

  return (
    <article className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-800">프로필 이름 저장</h3>
      <p className="mb-5 mt-2 text-sm leading-relaxed text-slate-500">Action의 반환값과 진행 상태를 React가 연결합니다.</p>
      {/* [cmp:form-submit:start] */}
      <form action={formAction} noValidate>
        <input type="hidden" name="shouldFail" value={String(shouldFail)} />
        <ActionFormFields input={result.input} />
      </form>
      {/* [cmp:form-submit:end] */}
      <FormFeedback result={result} pending={pending} />
    </article>
  );
}
