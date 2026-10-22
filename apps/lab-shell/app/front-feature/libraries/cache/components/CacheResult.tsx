import type { CacheRecord } from "../types";

export function CacheResult({ data, error, refreshing = false }: { data?: CacheRecord; error?: string; refreshing?: boolean }) {
  if (data) {
    return (
      <div className="space-y-3" aria-busy={refreshing}>
        <p className="m-0 text-xs text-slate-500" role="status">{refreshing ? "저장된 데이터 표시 · 갱신 중" : error ? "저장된 데이터 표시 · 갱신 실패" : "데이터 준비됨"}</p>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="m-0 text-base font-semibold text-slate-800">{data.title}</h3>
          <p className="mb-4 mt-2 text-sm leading-relaxed text-slate-500">{data.summary}</p>
          <p className="m-0 text-sm text-slate-600">작업 <strong className="tabular-nums text-slate-800">{data.taskCount}</strong>개</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div role="status" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        <p className="m-0 font-medium">요청 실패</p>
        <p className="mb-0 mt-2">{error} 닫고 다시 열어 재시도할 수 있습니다.</p>
      </div>
    );
  }
  return <p role="status" className="m-0 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">불러오는 중…</p>;
}
