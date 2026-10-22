import type { ReactNode } from "react";
import type { ActivityDemoKind, ActivityStats } from "../types";

export function ActivityDemoPanel({ kind, hidden, stats, children }: {
  kind: ActivityDemoKind;
  hidden: boolean;
  stats: ActivityStats;
  children: ReactNode;
}) {
  return (
    <section data-activity-demo={kind} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">{kind === "css" ? "CSS display: none" : "React Activity"}</h3>
        <span className={`text-xs font-medium ${hidden ? "text-amber-600" : "text-emerald-600"}`}>{hidden ? "숨김" : "표시"}</span>
      </header>
      <dl aria-label="Effect 실행 기록" className="grid grid-cols-3 gap-2">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-3"><dt className="text-xs text-slate-500">시작</dt><dd data-counter="setups" className="mt-1 font-mono text-lg font-medium text-slate-800">{stats.setups}</dd></div>
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-3"><dt className="text-xs text-slate-500">정리</dt><dd data-counter="cleanups" className="mt-1 font-mono text-lg font-medium text-slate-800">{stats.cleanups}</dd></div>
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-3"><dt className="text-xs text-slate-500">콜백</dt><dd data-counter="ticks" className="mt-1 font-mono text-lg font-medium text-slate-800">{stats.ticks}</dd></div>
      </dl>
      <p className="mt-3 text-xs leading-5 text-slate-500">Effect의 시작·정리와 500ms interval 콜백을 실제 실행될 때마다 기록합니다.</p>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        {children}
        {hidden && <p className="text-xs leading-5 text-slate-500">메모 패널을 숨겼습니다. 위 콜백 횟수가 계속 변하는지 확인하세요.</p>}
      </div>
    </section>
  );
}
