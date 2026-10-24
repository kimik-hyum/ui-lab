import type { ReactNode } from "react";

export function CachePanel({ open, attempts, children }: { open: boolean; attempts: number; children: ReactNode }) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{open ? "열림" : "닫힘"}</span>
        <span className="text-slate-500">요청 시도 <output aria-live="off" className="font-semibold tabular-nums text-slate-800">{attempts}</output>회</span>
      </div>
      {open ? children : <p className="m-0 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">열기를 눌러 같은 데이터를 요청하세요.</p>}
    </article>
  );
}
