import type { Metadata } from "next";
import Link from "next/link";
import {
  formatMetric,
  formatSnapshotDate,
  getPerformanceSnapshot,
  getSsrChart,
  getTargetDisplayName,
  getTargetVersion,
  getTargetMode,
  performanceSources,
  sortFrameworks,
} from "./data";

export const metadata: Metadata = {
  title: "성능 측정",
  description: "동일한 시나리오의 SSR 응답과 Lighthouse 측정 기록을 확인합니다.",
};

export default function PerformancePage() {
  const { ssr, lighthouse } = getPerformanceSnapshot();
  const chart = getSsrChart(ssr);
  const isQuickRun = ssr.runs < 20;

  return (
    <main className="min-w-0 space-y-7 px-4 py-6 sm:px-7 lg:px-9 lg:py-8 2xl:px-12">
      <header className="flex flex-col gap-5 border-b border-border pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 font-mono text-[11px] font-medium tracking-[0.16em] text-primary">PERFORMANCE LAB</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">성능 측정</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            SSR 응답과 Lighthouse의 저장된 측정 결과를 실행 환경·조건과 함께 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={performanceSources.methodology} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-white px-4 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary">
            측정 방법 <span aria-hidden="true">↗</span>
          </Link>
          <Link href="/performance/history" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-medium text-white transition-colors hover:bg-primary-hover">
            버전별 기록 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      {(ssr.network || lighthouse.network) && <div className="rounded-lg border border-primary/20 bg-primary-subtle px-5 py-4 text-sm"><p className="font-medium text-primary">SSR: {ssr.network?.label ?? "기존 설정"} · Lighthouse: {lighthouse.network?.label ?? "기존 설정"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">실제 Supabase 연결을 포함합니다. 제한 설정은 동일해도 외부 서버의 응답 시간은 달라질 수 있습니다.</p></div>}

      <section aria-label="측정 개요" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">비교 프레임워크</p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-foreground">{String(ssr.targets.length).padStart(2, "0")}<span className="ml-2 font-sans text-xs font-normal text-muted-foreground">frameworks</span></p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">대상별 측정 횟수</p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-foreground">{String(ssr.runs).padStart(2, "0")}<span className="ml-2 font-sans text-xs font-normal text-muted-foreground">{isQuickRun ? "quick run" : "runs"}</span></p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">측정 전 워밍업</p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-foreground">{String(ssr.warmup).padStart(2, "0")}<span className="ml-2 font-sans text-xs font-normal text-muted-foreground">requests</span></p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">기록 유형</p>
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-foreground"><span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />저장된 스냅샷</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{formatSnapshotDate(ssr.generatedAt)} KST</p>
        </div>
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="content-ready-heading" className="min-w-0 overflow-hidden rounded-xl border border-border bg-white">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-5 sm:px-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="content-ready-heading" className="text-base font-semibold text-foreground">콘텐츠 도착 시간</h2>
                <span className="rounded-md bg-primary-subtle px-2 py-0.5 font-mono text-[10px] font-medium text-primary">PRIMARY METRIC</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">핵심 콘텐츠가 HTML에 처음 포함된 시점 · Content-ready</p>
            </div>
            <span className="rounded-md border border-border px-2 py-1 font-mono text-[11px] text-muted-foreground">median / ms</span>
          </div>
          <div className="p-5 sm:p-6">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-2 w-2 rounded-sm bg-primary" />Content-ready</span>
              <span>낮을수록 빠른 콘텐츠 도착</span>
            </div>
            <div className="space-y-6">
              {chart.targets.map((target) => (
                <div key={target.name} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 sm:grid-cols-[118px_minmax(0,1fr)_78px]">
                  <div className="flex items-center gap-2 sm:block">
                    <p className="text-sm font-semibold text-foreground">{target.label}</p>
                    <p className="font-mono text-[10px] text-primary">v{target.version}</p>
                    <p className="font-mono text-[10px] text-muted-foreground sm:mt-1">{target.mode}</p>
                  </div>
                  <div className="relative col-span-2 row-start-2 h-7 overflow-hidden rounded bg-surface sm:col-span-1 sm:row-auto" aria-hidden="true">
                    <div className="absolute inset-0 grid grid-cols-4">{[0, 1, 2, 3].map((line) => <span key={line} className="border-r border-border last:border-0" />)}</div>
                    <div className="relative h-full rounded-r bg-primary/85" style={{ width: `${target.width}%` }} />
                  </div>
                  <p className="col-start-2 row-start-1 text-right font-mono text-sm font-semibold tabular-nums text-foreground sm:col-start-auto sm:row-auto">{formatMetric(target.medianMetrics.contentReadyMs)} <span className="text-[10px] font-normal text-muted-foreground">ms</span></p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground sm:ml-[134px] sm:mr-[94px]" aria-hidden="true">
              {chart.ticks.map((tick) => <span key={tick}>{formatMetric(tick, 0)}</span>)}
            </div>
            {isQuickRun && (
              <div className="mt-7 rounded-lg border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-xs leading-6 text-amber-900">
                <span className="font-semibold">{ssr.runs}회 측정한 quick 기록입니다.</span> 프레임워크의 성능 순위를 판단하기보다 실행 결과를 확인하는 용도로 읽어주세요. 별도 리포트에 20회 반복 측정 결과가 있습니다.
              </div>
            )}
          </div>
        </section>

        <aside aria-labelledby="environment-heading" className="rounded-xl border border-border bg-white p-5 sm:p-6">
          <p className="mb-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">EXPERIMENT CONTEXT</p>
          <h2 id="environment-heading" className="text-base font-semibold text-foreground">어떤 환경에서 측정했나요?</h2>
          <dl className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-4 text-xs">
            <dt className="text-muted-foreground">시나리오</dt><dd className="break-words font-medium text-foreground">Shopping detail SSR</dd>
            <dt className="text-muted-foreground">CPU</dt><dd className="text-foreground">{ssr.environment.cpu}</dd>
            <dt className="text-muted-foreground">OS</dt><dd className="text-foreground">{ssr.environment.platform} · {ssr.environment.arch}</dd>
            <dt className="text-muted-foreground">Node.js</dt><dd className="font-mono text-foreground">{ssr.environment.node}</dd>
            <dt className="text-muted-foreground">콘텐츠 마커</dt><dd className="text-foreground">&quot;{ssr.expectedText}&quot;</dd>
            <dt className="text-muted-foreground">환경 시간대</dt><dd className="text-foreground">{ssr.environment.timeZone}</dd>
          </dl>
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-[11px] text-muted-foreground">측정 경로</p>
            <p className="mt-1 break-all font-mono text-[11px] leading-5 text-foreground">{ssr.path}</p>
          </div>
          <p className="mt-4 text-xs leading-6 text-muted-foreground">네트워크 상태와 Supabase 리전은 이 JSON에 기록되어 있지 않습니다.</p>
          <Link href={performanceSources.ssr} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-primary hover:underline">원본 SSR 데이터 보기 <span aria-hidden="true">↗</span></Link>
        </aside>
      </div>

      <section aria-labelledby="response-detail-heading" className="min-w-0 overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-5 sm:px-6">
          <div><h2 id="response-detail-heading" className="text-base font-semibold text-foreground">응답 상세 비교</h2><p className="mt-1 text-xs text-muted-foreground">콘텐츠 도착, 첫 응답, 전송 완료를 구분해 읽습니다.</p></div>
          <span className="font-mono text-[11px] text-muted-foreground">{ssr.targets.length} TARGETS</span>
        </div>
        <p className="border-b border-border px-5 py-2 text-[10px] text-muted-foreground sm:px-6 xl:hidden">표를 좌우로 스크롤해 전체 지표를 확인하세요.</p>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="SSR 상세 측정 표, 작은 화면에서는 좌우로 스크롤하세요">
          <table className="w-full min-w-[790px] border-collapse text-left text-xs">
            <caption className="sr-only">저장된 SSR 측정의 프레임워크별 content-ready, TTFB, 응답 완료 시간 및 HTML 크기</caption>
            <thead className="bg-surface text-muted-foreground">
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-surface px-6 py-3 font-medium">프레임워크</th><th scope="col" className="px-4 py-3 font-medium">응답 방식</th><th scope="col" className="px-4 py-3 text-right font-medium text-primary">Content-ready</th><th scope="col" className="px-4 py-3 text-right font-medium">TTFB</th><th scope="col" className="px-4 py-3 text-right font-medium">Total</th><th scope="col" className="px-4 py-3 text-right font-medium">HTML</th><th scope="col" className="px-6 py-3 font-medium">SSR 검사</th>
              </tr>
            </thead>
            <tbody>
              {sortFrameworks(ssr.targets).map((target) => (
                <tr key={target.name} className="border-t border-border transition-colors hover:bg-surface/60">
                  <th scope="row" className="sticky left-0 z-10 bg-white px-6 py-4 font-semibold text-foreground">{getTargetDisplayName(target.name)}<span className="mt-1 block font-mono text-[10px] font-normal text-muted-foreground">{getTargetVersion(target.name, target.versions)}</span></th>
                  <td className="px-4 py-4 font-mono text-[10px] text-muted-foreground">{getTargetMode(target.name, ssr.path)}</td>
                  <td className="px-4 py-4 text-right font-mono text-primary">
                    <p className="font-semibold">{formatMetric(target.medianMetrics.contentReadyMs)} ms</p>
                    <p className="mt-1 whitespace-nowrap text-[9px] font-normal text-muted-foreground">min {formatMetric(target.distribution.contentReadyMs.min)} · p95 {formatMetric(target.distribution.contentReadyMs.p95)}</p>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-foreground">{formatMetric(target.medianMetrics.ttfbMs)} ms</td>
                  <td className="px-4 py-4 text-right font-mono text-foreground">{formatMetric(target.medianMetrics.totalMs)} ms</td>
                  <td className="px-4 py-4 text-right font-mono text-foreground">{formatMetric(target.medianMetrics.htmlBytes, 0)} B</td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium ${target.checklist.statusOk && target.checklist.expectedTextOk && target.checklist.contentReadyOk ? "bg-primary-subtle text-primary" : "bg-amber-50 text-amber-800"}`}><span className="h-1 w-1 rounded-full bg-current" aria-hidden="true" />{target.checklist.statusOk && target.checklist.expectedTextOk && target.checklist.contentReadyOk ? "통과" : "확인 필요"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-5 py-4 text-xs leading-6 text-muted-foreground sm:px-6">
          이 표는 변경 전 측정 기록입니다. 당시 Next.js는 Streaming, 나머지는 Blocking이었으며, 현재 코드는 네 앱 모두 Blocking으로 통일했습니다. 과거 Streaming의 TTFB는 셸 도착 시간이므로 Blocking과 TTFB만으로 비교하지 않습니다.
        </div>
      </section>

      <section aria-labelledby="lighthouse-heading" className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-3"><h2 id="lighthouse-heading" className="text-base font-semibold text-foreground">Lighthouse</h2><span className="rounded-md bg-surface px-2 py-1 font-mono text-[10px] text-muted-foreground">BROWSER PERFORMANCE</span></div>
          <Link href={performanceSources.lighthouse} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline">원본 데이터 ↗</Link>
        </div>
        {sortFrameworks(lighthouse.targets).map((target) => (
          <div key={target.name} className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{getTargetDisplayName(target.name)} {getTargetVersion(target.name, target.versions)} · {lighthouse.preset}</p>
              <p className="mt-2 font-mono text-4xl font-semibold tracking-tight text-foreground">{target.medianPerformanceScore}<span className="ml-1 text-sm font-normal text-muted-foreground">/ 100</span></p>
              <p className="mt-2 text-xs text-muted-foreground">Performance score</p>
            </div>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-6">
              {([
                ["FCP", `${formatMetric(target.medianMetrics.fcpMs)} ms`],
                ["LCP", `${formatMetric(target.medianMetrics.lcpMs)} ms`],
                ["TBT", `${formatMetric(target.medianMetrics.tbtMs, 0)} ms`],
                ["CLS", formatMetric(target.medianMetrics.cls, 3)],
                ["Speed Index", `${formatMetric(target.medianMetrics.speedIndexMs)} ms`],
                ["INP", target.medianMetrics.inpMs === null ? "미측정" : `${formatMetric(target.medianMetrics.inpMs)} ms`],
              ] as const).map(([label, value]) => <div key={label} className="border-l border-border pl-4"><p className="text-[11px] text-muted-foreground">{label}</p><p className={`mt-2 text-sm font-medium text-foreground ${value === "미측정" ? "font-sans" : "font-mono"}`}>{value}</p></div>)}
            </div>
          </div>
        ))}
        <p className="border-t border-border px-5 py-4 text-xs leading-6 text-muted-foreground sm:px-6">
          {formatSnapshotDate(lighthouse.generatedAt)} KST · {lighthouse.runs}회 측정 · {lighthouse.targets.length}개 대상의 별도 기록입니다. SSR 시간과 점수를 합산하지 않습니다.
        </p>
      </section>
    </main>
  );
}
