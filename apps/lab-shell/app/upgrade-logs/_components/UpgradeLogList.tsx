import Link from "next/link";
import type { UpgradeLog } from "../_lib/types";
import { formatLogDate } from "../_lib/format";
import UpgradeStatusBadge from "./UpgradeStatusBadge";

export default function UpgradeLogList({ logs }: { logs: UpgradeLog[] }) {
  const workspaces = new Set(logs.flatMap((log) => log.packages.map((pkg) => pkg.workspace)));
  const stats = [
    { label: "전체 기록", value: logs.length },
    { label: "적용 완료", value: logs.filter((log) => log.status === "completed").length },
    { label: "대상 앱", value: workspaces.size },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 lg:px-12 lg:py-16">
      <header className="border-b border-slate-200 pb-10">
        <p className="mb-4 font-mono text-xs tracking-[0.2em] text-violet-600">UI-LAB / CHANGELOG</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">버전업 로그</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">무엇을 올렸고, 왜 바꿨는지.<br />바뀐 코드와 변경 이유, 관련 문서 지침을 모았습니다.</p>
      </header>

      <dl className="my-8 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50/70 py-5">
        {stats.map((stat) => <div key={stat.label} className="px-5 lg:px-8"><dt className="text-xs text-slate-500">{stat.label}</dt><dd className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{stat.value.toString().padStart(2, "0")}</dd></div>)}
      </dl>

      <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-800">업데이트 이력</h2><span className="text-xs text-slate-400">최신 작업순</span></div>
      {logs.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 px-8 py-16 text-center"><h3 className="font-semibold text-slate-800">아직 버전업 기록이 없습니다.</h3><p className="mt-2 text-sm text-slate-500">첫 업데이트를 진행하면 바뀐 코드와 변경 이유가 여기에 표시됩니다.</p></div> : (
        <div className="space-y-4">{logs.map((log) => {
          const primary = log.packages[0];
          const apps = [...new Set(log.packages.map((pkg) => pkg.workspace))];
          return <Link key={log.id} href={`/upgrade-logs/${log.id}`} className="group block rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-violet-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600 lg:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><time dateTime={log.startedAt} className="text-xs text-slate-500">{formatLogDate(log.startedAt)}</time><UpgradeStatusBadge status={log.status} /></div>
            <div className="flex items-start justify-between gap-4"><h3 className="text-xl font-semibold tracking-tight text-slate-900 group-hover:text-violet-700">{log.title}</h3><span aria-hidden="true" className="text-xl text-slate-300 group-hover:text-violet-600">↗</span></div>
            {primary && <p className="mt-3 flex flex-wrap items-center gap-3 font-mono text-sm"><span className="text-slate-400">{primary.installedBefore}</span><span aria-hidden="true" className="text-slate-300">→</span><span className="rounded-md bg-violet-50 px-2.5 py-1 font-medium text-violet-700">{primary.installedAfter ?? primary.target}</span></p>}
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">{log.summary}</p>
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">{apps.map((app) => <span key={app} className="rounded-md border border-slate-200 px-2 py-1 font-mono text-[11px] text-slate-600">{app}</span>)}<span className="ml-auto text-xs text-slate-400">코드 변경 {log.changes.length}건 · 문서 {log.sources.length}개</span></div>
          </Link>;
        })}</div>
      )}
    </main>
  );
}
