import Link from "next/link";
import type { UpgradeLog } from "../_lib/types";
import { formatLogDate } from "../_lib/format";
import UpgradeChangeCard from "./UpgradeChangeCard";
import UpgradePackageTable from "./UpgradePackageTable";
import UpgradeStatusBadge from "./UpgradeStatusBadge";

export default function UpgradeLogDetail({ log }: { log: UpgradeLog }) {
  const apps = [...new Set(log.packages.map((pkg) => pkg.workspace))];
  return (
    <main className="mx-auto max-w-7xl px-6 py-10 lg:px-12 lg:py-14">
      <Link href="/upgrade-logs" className="text-sm text-slate-500 transition hover:text-violet-700">← 전체 버전업 로그</Link>
      <header className="mt-8 border-b border-slate-200 pb-8">
        <div className="mb-4 flex flex-wrap items-center gap-3"><p className="font-mono text-xs tracking-[0.15em] text-violet-600">UPGRADE RECORD</p><span className="text-slate-200">/</span><time dateTime={log.startedAt} className="text-xs text-slate-500">{formatLogDate(log.startedAt)}</time><UpgradeStatusBadge status={log.status} /></div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">{log.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500">{log.summary}</p>
        <div className="mt-5 flex flex-wrap gap-2">{apps.map((app) => <span key={app} className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600">{app}</span>)}</div>
      </header>

      <nav aria-label="로그 목차" className="my-8 flex flex-wrap gap-2">{[["changes", "01", "코드 변경과 이유"], ["packages", "02", "패키지 버전"], ["sources", "03", "공식 문서"]].map(([id, number, label]) => <a key={id} href={`#${id}`} className="rounded-full border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:border-violet-300 hover:text-violet-700"><span className="mr-2 font-mono text-slate-400">{number}</span>{label}</a>)}</nav>

      <div className="space-y-10">
        <section id="changes" className="scroll-mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900"><span className="mr-3 font-mono text-xs text-violet-500">01</span>코드 변경과 이유</h2>
          <div className="space-y-4">{log.changes.map((change, index) => <UpgradeChangeCard key={index} change={change} sources={log.sources} />)}</div>
        </section>

        <section id="packages" className="scroll-mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900"><span className="mr-3 font-mono text-xs text-violet-500">02</span>패키지 버전</h2>
          <UpgradePackageTable packages={log.packages} />
        </section>

        <section id="sources" className="scroll-mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900"><span className="mr-3 font-mono text-xs text-violet-500">03</span>공식 문서</h2>
          <div className="grid gap-3 sm:grid-cols-2">{log.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 p-4 transition hover:border-violet-300"><h3 className="text-sm font-medium leading-6 text-slate-700">{source.title} <span className="text-slate-400">↗</span></h3><p className="mt-2 text-[11px] text-slate-400">{new URL(source.url).hostname}</p></a>)}</div>
        </section>
      </div>
    </main>
  );
}
