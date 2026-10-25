import Link from "next/link";
import { formatMetric, formatSnapshotDate } from "../data";
import { hasNewerCommentMeasurements, resolveCommentMeasurements, type PerformanceComment } from "../comment-model";
import { getPerformanceComments } from "../comments-data";
import { timeDifference, timeValue } from "../history-comparison";
import { getMeasurementHistory } from "../history-data";

const codeLabels = { unchanged: "시나리오 코드 유지", migration: "호환성 이전 적용", optimized: "성능 최적화 적용", rendering: "응답 방식 변경" };
const statusLabels = { observed: "관찰 기록", investigating: "원인 조사 중", resolved: "원인 확인" };

function Comment({ comment }: { comment: PerformanceComment }) {
  const records = getMeasurementHistory();
  const evidence = resolveCommentMeasurements(comment, records);
  return (
    <article id={`comment-${comment.id}`} data-performance-comment={comment.id} className="min-w-0 border-t border-border bg-surface/60 px-5 py-5 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold">{comment.fromVersion === comment.toVersion ? "측정 코멘트" : "버전 변경 코멘트"}</h4>
            <span className="font-mono text-xs text-muted-foreground">{comment.fromVersion === comment.toVersion ? comment.toVersion : `${comment.fromVersion} → ${comment.toVersion}`}</span>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{codeLabels[comment.code.kind]} · <time dateTime={comment.recordedOn}>{comment.recordedOn}</time></p>
        </div>
        <span className={`rounded border px-2 py-1 text-[11px] ${comment.status === "investigating" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-border bg-white text-muted-foreground"}`}>{statusLabels[comment.status]}</span>
      </header>
      <dl className="mt-4 space-y-3 text-xs leading-6 sm:text-sm">
        {([
          [comment.fromVersion === comment.toVersion ? "측정 기준" : "버전 변경", comment.versionChanges],
          ["코드 대응", comment.code.description],
          ["관찰 결과", comment.observation],
          ["현재 판단", comment.conclusion],
        ] as const).map(([label, text]) => (
          <div key={label} className="grid gap-0.5 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-4">
            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
            <dd className="min-w-0 text-foreground">{text}</dd>
          </div>
        ))}
      </dl>
      {hasNewerCommentMeasurements(comment, records) && <p className="mt-4 text-xs text-amber-800">이후 새 측정이 있습니다. 이 코멘트는 아래에 연결된 분석 당시 기록을 설명합니다.</p>}
      <details className="mt-4 text-xs">
        <summary className="w-fit py-1 font-medium text-primary">측정 근거와 공식 문서</summary>
        <div className="mt-3 space-y-4 rounded-lg border border-border bg-white p-4">
          <p className="text-[11px] leading-5 text-muted-foreground">{comment.scenarioPath} · 분석 당시 측정에 고정된 값입니다.</p>
          {evidence.map(({ kind, before, after }) => {
            const key = kind === "ssr" ? "contentReadyMs" : "lcpMs";
            const delta = timeDifference(after, before ?? undefined, key);
            const metric = (value: number | null) => value === null ? "미측정" : `${formatMetric(value)} ms`;
            return (
              <div key={kind} data-comment-evidence={kind} className="space-y-1.5 border-t border-border pt-3 leading-5">
                <p className="font-medium">{kind === "ssr" ? "SSR 콘텐츠 도착" : "Lighthouse LCP"}</p>
                <p className="flex flex-wrap gap-x-2 gap-y-1 font-mono">
                  <span>{before && `${metric(timeValue(before, key))} → `}{metric(timeValue(after, key))}</span>
                  <span className="text-muted-foreground">{!before ? "새 기준 측정" : delta ? `(${delta.percent > 0 ? "+" : ""}${formatMetric(delta.percent, 1)}%)` : "조건 달라 증감 비교 제외"}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">{after.record.network?.label ?? "네트워크 설정 미기록"} · {after.record.runs}회{kind === "ssr" ? " 중앙값" : " · 점수 중앙 실행의 LCP"}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
                  {before && <Link href={`/performance/export?record=${encodeURIComponent(before.record.id)}`} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">이전 {formatSnapshotDate(before.record.generatedAt)} KST ↗</Link>}
                  <Link href={`/performance/export?record=${encodeURIComponent(after.record.id)}`} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">{before ? "이후" : "측정"} {formatSnapshotDate(after.record.generatedAt)} KST ↗</Link>
                </div>
              </div>
            );
          })}
          {evidence.length < comment.measurements.length && <p className="text-amber-800">일부 근거 기록의 연결을 확인해야 합니다.</p>}
          <ul className="space-y-2 border-t border-border pt-3">
            {comment.sources.map((source) => <li key={source.url}><Link href={source.url} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">{source.title} ↗</Link></li>)}
            {comment.reportPath && <li><Link href={`/performance/export?analysis=${encodeURIComponent(comment.id)}`} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">상세 분석 문서 원문 ↗</Link></li>}
          </ul>
        </div>
      </details>
    </article>
  );
}

export default function FrameworkComments({ framework }: { framework: string }) {
  const [latest, ...previous] = getPerformanceComments(framework);
  if (!latest) return null;
  return (
    <aside aria-label="성능 분석 코멘트">
      <Comment comment={latest} />
      {previous.length > 0 && <details className="border-t border-border"><summary className="px-5 py-4 text-xs text-primary sm:px-6">이전 분석 코멘트 {previous.length}건</summary>{previous.map((comment) => <Comment key={comment.id} comment={comment} />)}</details>}
    </aside>
  );
}
