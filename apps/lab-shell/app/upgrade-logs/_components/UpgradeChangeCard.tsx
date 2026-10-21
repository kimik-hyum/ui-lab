import type { UpgradeSource, UsageChange } from "../_lib/types";
import { buildFileDiff } from "../_lib/code-diff";
import UpgradeCodeDiff from "./UpgradeCodeDiff";

export default function UpgradeChangeCard({ change, sources }: { change: UsageChange; sources: UpgradeSource[] }) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200">
      <h3 className="px-5 pt-5 text-sm font-medium leading-6 text-slate-800">{change.reason}</h3>
      {change.recommendation && <p className="mx-5 mt-3 border-l-2 border-violet-200 pl-3 text-xs leading-6 text-slate-500"><span className="mr-2 font-medium text-violet-700">문서 지침</span>{change.recommendation}</p>}
      {change.files.length ? <UpgradeCodeDiff files={change.files.map(buildFileDiff)} /> : <details className="mt-2">
        <summary className="cursor-pointer px-5 py-3 text-xs text-slate-500 hover:text-violet-700">변경 전후·파일 보기</summary>
        <div className="flex flex-wrap gap-1.5 px-5 pb-4">{change.paths.map((file) => <code key={file} className="break-all rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-500">{file}</code>)}</div>
        <div className="grid border-y border-slate-200 lg:grid-cols-2">
          <div className="min-w-0 bg-slate-50 p-5"><p className="mb-3 font-mono text-[10px] tracking-wider text-slate-400">BEFORE</p><pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-600">{change.before}</pre></div>
          <div className="min-w-0 border-t border-slate-200 bg-violet-50/40 p-5 lg:border-t-0 lg:border-l"><p className="mb-3 font-mono text-[10px] tracking-wider text-violet-500">AFTER</p><pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-800">{change.after}</pre></div>
        </div>
      </details>}
      <div className="flex flex-wrap gap-3 px-5 py-3">{change.sourceIds.map((id) => {
        const source = sources.find((item) => item.id === id)!;
        return <a key={id} href={source.url} target="_blank" rel="noreferrer" className="text-xs text-violet-600 hover:underline">{source.title} ↗</a>;
      })}</div>
    </article>
  );
}
