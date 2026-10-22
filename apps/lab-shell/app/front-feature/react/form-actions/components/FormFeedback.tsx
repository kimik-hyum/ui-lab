import type { ProfileResult } from "../form-action";

export function FormFeedback({ result, pending }: { result: ProfileResult; pending: boolean }) {
  return (
    <div className="mt-5 space-y-4">
      <p
        role="status"
        aria-live="polite"
        className={`min-h-12 rounded-lg border p-3 text-sm ${result.status === "error" && !pending ? "border-red-200 bg-red-50 text-red-600" : "border-slate-200 bg-slate-50 text-slate-600"}`}
      >
        {pending ? "저장 중 · 같은 폼의 중복 제출을 막고 있어요." : result.message}
      </p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-slate-200 p-3"><dt className="text-xs text-slate-500">마지막 저장 이름</dt><dd className="mt-1 break-words font-semibold text-slate-800">{result.savedName}</dd></div>
        <div className="rounded-lg border border-slate-200 p-3"><dt className="text-xs text-slate-500">완료한 제출</dt><dd className="mt-1 font-semibold text-slate-800">{result.attempts}회</dd></div>
      </dl>
    </div>
  );
}
