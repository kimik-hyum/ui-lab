import type { VerificationState } from "../types";

export function VerificationFeedback({ result, pending, statusId }: { result: VerificationState; pending: boolean; statusId: string }) {
  return (
    <div className="mt-5 space-y-4">
      <p id={statusId} role="status" className={`text-sm leading-relaxed ${result.status === "error" && !pending ? "text-red-600" : "text-slate-500"}`}>
        {pending ? "서버에서 확인하고 있습니다…" : result.message}
      </p>
      <dl className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <div><dt className="text-xs text-slate-500">서버 응답의 진입점</dt><dd className="mt-1 break-words text-xs text-slate-700" data-server-via>{result.via === "api-route" ? "POST /api/server-action-demo" : result.via === "server-action" ? "Server Action · 함수 호출" : "아직 없음"}</dd></div>
        <div><dt className="text-xs text-slate-500">서버가 정리한 이름</dt><dd className="mt-1 break-words font-semibold text-slate-800" data-verified-name>{result.normalizedName ?? "아직 없음"}</dd></div>
        <div><dt className="text-xs text-slate-500">서버 확인번호 · 성공한 요청마다 생성</dt><dd className="mt-1 break-all font-mono text-xs text-slate-700" data-server-receipt>{result.receipt ?? "아직 없음"}</dd></div>
      </dl>
    </div>
  );
}
