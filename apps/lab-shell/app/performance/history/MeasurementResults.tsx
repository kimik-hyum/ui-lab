import Link from "next/link";
import { formatMetric, formatSnapshotDate, getTargetMode } from "../data";
import type { MeasurementEntry, MeasurementRecord } from "../history-data";

export const metric = (value: number | null | undefined, unit = " ms", digits = 2) =>
  typeof value === "number" ? `${formatMetric(value, digits)}${unit}` : "미측정";

function modeLabel(mode: string) {
  return mode === "parallel" ? "병렬 점검" : mode === "sequential" ? "통합 순차 점검" : "분리 측정";
}

function MeasurementDetails({ entry }: { entry: MeasurementEntry }) {
  const { record, target } = entry;
  const metrics = record.kind === "ssr"
    ? [["TTFB", metric(target.medianMetrics.ttfbMs)], ["전송 완료", metric(target.medianMetrics.totalMs)], ["HTML", metric(target.medianMetrics.htmlBytes, " B", 0)]]
    : [["FCP", metric(target.medianMetrics.fcpMs)], ["TBT", metric(target.medianMetrics.tbtMs)], ["CLS", metric(target.medianMetrics.cls, "", 3)], ["Speed Index", metric(target.medianMetrics.speedIndexMs)], ["INP", metric(target.medianMetrics.inpMs)]];

  return (
    <details className="mt-4 text-xs">
      <summary className="w-fit cursor-pointer py-1 font-medium text-muted-foreground hover:text-primary">상세 지표와 측정 조건</summary>
      <div className="mt-3 space-y-4 rounded-lg bg-surface p-4 leading-6 text-muted-foreground">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          {metrics.map(([label, value]) => <div key={label}><dt>{label}</dt><dd className="font-mono text-foreground">{value}</dd></div>)}
        </dl>
        <div className="space-y-1 border-t border-border pt-3">
          <p className="break-all font-mono text-[11px]">{record.path}</p>
          <p>{record.environment.cpu} · {record.environment.platform} · Node {record.environment.node}</p>
          {record.warmup !== null && <p>예열 {record.warmup}회 제외</p>}
          {record.expectedText && <p>확인 콘텐츠: {record.expectedText}</p>}
          {record.kind === "ssr" && <p>응답 방식: {getTargetMode(target.name, record.path)}</p>}
          {record.kind === "lighthouse" && <p>지표는 점수 기준 중앙 실행의 값입니다. INP는 상호작용 기록이 없으면 미측정입니다.</p>}
        </div>
        <div className="space-y-1 border-t border-border pt-3">
          <p className="font-medium text-foreground">버전 정보: {target.versionEvidence?.kind === "reconstructed" ? "이력에서 복원" : target.versionEvidence ? "측정 시 확인" : "미기록"}</p>
          <p>{target.versionEvidence?.reference ?? "버전 근거 미기록"}{target.versionEvidence?.commit ? ` · ${target.versionEvidence.commit.slice(0, 7)}` : ""}</p>
          <p className="break-words">{Object.entries(target.versions).map(([name, value]) => `${name} ${value}`).join(" · ")}</p>
          {record.source && <p>측정 코드: <code>{record.source.commit.slice(0, 7)}</code>{record.source.dirty ? " + 미커밋 변경" : ""}</p>}
        </div>
        <Link href={`/performance/export?record=${encodeURIComponent(record.id)}`} target="_blank" className="inline-block font-medium text-primary hover:underline">측정 요약 JSON ↗</Link>
      </div>
    </details>
  );
}

function MeasurementResult({ entry, compact = false }: { entry: MeasurementEntry; compact?: boolean }) {
  const { record, target } = entry;
  const quick = record.runs < (record.kind === "ssr" ? 20 : 5);
  const failed = target.checklist
    ? Object.values(target.checklist).some((value) => value !== true)
    : record.kind === "lighthouse" && target.medianPerformanceScore === null;

  return (
    <div data-measurement-record={record.id} className={compact ? "border-t border-border pt-4" : ""}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>{formatSnapshotDate(record.generatedAt)} KST</p>
        <p className={quick || failed ? "text-amber-700" : ""}>{record.runs}회{quick ? " · 빠른 점검" : " · 반복 측정"}{failed ? " · 확인 필요" : ""}</p>
      </div>
      <div className={`mt-4 flex flex-wrap items-end justify-between gap-4 ${compact ? "text-xl" : "text-3xl"}`}>
        <div>
          <p className="font-mono font-semibold tracking-tight tabular-nums text-foreground">
            {record.kind === "ssr" ? metric(target.medianMetrics.contentReadyMs, "") : target.medianPerformanceScore ?? "—"}
            <span className="ml-1.5 text-sm font-normal text-muted-foreground">{record.kind === "ssr" ? "ms" : "/ 100"}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{record.kind === "ssr" ? "콘텐츠 도착 · 중앙값" : "Performance 점수"}</p>
        </div>
        <dl className="flex gap-5 text-xs">
          {(record.kind === "ssr"
            ? [["최소", metric(target.distribution?.contentReadyMs?.min)], ["p95", metric(target.distribution?.contentReadyMs?.p95)]]
            : [["LCP", metric(target.medianMetrics.lcpMs)]])
            .map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-mono font-medium text-foreground">{value}</dd></div>)}
        </dl>
      </div>
      <p className="mt-4 break-words text-xs leading-5 text-muted-foreground">{record.path === "/scenarios/shopping-detail-ssr" ? "상품 상세 SSR" : record.path} · {modeLabel(record.mode)}{record.preset ? ` · ${record.preset}` : ""}</p>
      <MeasurementDetails entry={entry} />
    </div>
  );
}

export default function MeasurementResults({ kind, entries }: { kind: MeasurementRecord["kind"]; entries: MeasurementEntry[] }) {
  const [latest, ...previous] = entries;
  const label = kind === "ssr" ? "SSR 응답" : "Lighthouse";
  return (
    <section aria-label={label} data-measurement-kind={kind} className="min-w-0 p-5 sm:p-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold">{label}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{kind === "ssr" ? "서버에서 콘텐츠가 도착하는 시간" : "브라우저에서 화면이 표시되는 성능"}</p>
        </div>
        <span className="shrink-0 rounded border border-border px-2 py-1 text-[11px] text-muted-foreground">{entries.length}개 기록</span>
      </header>
      {latest ? <MeasurementResult entry={latest} /> : <p className="py-7 text-sm text-muted-foreground">이 버전의 {label} 측정 기록이 없습니다.</p>}
      {previous.length > 0 && (
        <details className="mt-5 border-t border-border pt-4">
          <summary className="w-fit cursor-pointer py-1 text-xs font-medium text-primary">이전 {label} 측정 {previous.length}건</summary>
          <div className="mt-3 space-y-5">{previous.map((entry) => <MeasurementResult key={entry.record.id} entry={entry} compact />)}</div>
        </details>
      )}
    </section>
  );
}
