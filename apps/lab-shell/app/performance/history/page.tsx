import type { Metadata } from "next";
import Link from "next/link";
import { TabsContent } from "@/components/ui/tabs";
import { formatSnapshotDate, getTargetDisplayName } from "../data";
import { getFrameworkHistory } from "../history-data";
import MeasurementResults, { metric } from "./MeasurementResults";
import VersionTabs from "./VersionTabs";

export const metadata: Metadata = {
  title: "버전별 성능 기록",
  description: "최신 버전 결과를 한눈에 보고, 프레임워크와 버전별로 SSR·Lighthouse 기록을 확인합니다.",
};

export default async function PerformanceHistoryPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const frameworks = getFrameworkHistory();

  return (
    <main className="min-w-0 space-y-10 px-4 py-6 sm:px-7 lg:px-9 lg:py-8 2xl:px-12">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-7">
        <div>
          <p className="mb-2 font-mono text-[11px] font-medium tracking-[0.16em] text-primary">PERFORMANCE HISTORY</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">버전별 측정 기록</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">최신 결과를 먼저 보고, 프레임워크별로 이전 버전을 살펴보세요.</p>
        </div>
        <Link href="/performance" className="inline-flex min-h-10 items-center rounded-lg border border-border bg-white px-4 text-xs font-medium hover:border-primary hover:text-primary">최신 결과 상세 비교 →</Link>
      </header>

      <section aria-labelledby="latest-versions-heading" data-latest-versions>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="latest-versions-heading" className="text-lg font-semibold">최신 버전 요약</h2>
          <p className="text-xs text-muted-foreground">보관된 버전 중 가장 높은 버전 · 검사별 최근 측정</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {frameworks.map(({ name, versions }) => {
            const latest = versions[0];
            const ssr = latest.measurements.ssr[0];
            const lighthouse = latest.measurements.lighthouse[0];
            return (
              <article key={name} data-latest-framework={name} data-version={latest.version} className="min-w-0 rounded-xl border border-border bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{getTargetDisplayName(name)}</h3>
                  <span className="rounded-md bg-primary-subtle px-2 py-1 font-mono text-xs text-primary">{latest.version}</span>
                </div>
                <dl className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-muted-foreground">SSR 응답</dt>
                    <dd className="mt-2 font-mono text-xl font-semibold tabular-nums">{metric(ssr?.target.medianMetrics.contentReadyMs, "")}<span className="ml-1 text-xs font-normal text-muted-foreground">{ssr ? "ms" : ""}</span></dd>
                    <dd className="mt-1.5 text-[11px] text-muted-foreground">{ssr ? `${ssr.record.runs}회 · 콘텐츠 도착` : "기록 없음"}</dd>
                  </div>
                  <div className="border-l border-border pl-4">
                    <dt className="text-xs text-muted-foreground">Lighthouse</dt>
                    <dd className="mt-2 font-mono text-xl font-semibold tabular-nums">{lighthouse?.target.medianPerformanceScore ?? "—"}<span className="ml-1 text-xs font-normal text-muted-foreground">/ 100</span></dd>
                    <dd className="mt-1.5 text-[11px] text-muted-foreground">{lighthouse ? `${lighthouse.record.runs}회 · ${lighthouse.record.preset ?? "preset 미기록"}` : "기록 없음"}</dd>
                  </div>
                </dl>
                <div className="mt-5 border-t border-border pt-3">
                  <p className="text-[10px] leading-5 text-muted-foreground">SSR {ssr ? formatSnapshotDate(ssr.record.generatedAt) : "미측정"}<br />LH {lighthouse ? formatSnapshotDate(lighthouse.record.generatedAt) : "미측정"} · KST</p>
                  <Link href={`#${name}`} className="mt-2 inline-flex min-h-8 items-center text-xs font-medium text-primary hover:underline">버전별 기록 ↓</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="framework-history-heading" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 id="framework-history-heading" className="text-lg font-semibold">프레임워크별 기록</h2>
            <p className="mt-1 text-sm text-muted-foreground">버전을 선택하면 SSR과 Lighthouse 결과를 각각 볼 수 있습니다.</p>
          </div>
          <nav aria-label="프레임워크 바로가기" className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
            {frameworks.map(({ name }) => <Link key={name} href={`#${name}`} className="inline-flex min-h-9 items-center hover:text-primary">{getTargetDisplayName(name)}</Link>)}
          </nav>
        </div>

        {frameworks.map(({ name, versions }, index) => {
          const requested = first(query[`version.${name}`]) ?? (first(query.framework) === name ? first(query.version) : undefined);
          const selected = versions.find((item) => item.version === requested)?.version ?? versions[0].version;
          return (
            <section key={name} id={name} data-framework-section={name} aria-labelledby={`${name}-heading`} className="min-w-0 scroll-mt-24 overflow-hidden rounded-xl border border-border bg-white">
              <header className="flex items-center justify-between gap-4 px-5 pb-2 pt-6 sm:px-6">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-surface font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  <h3 id={`${name}-heading`} className="text-xl font-semibold tracking-tight">{getTargetDisplayName(name)}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{versions.length}개 버전</p>
              </header>
              <VersionTabs framework={name} label={getTargetDisplayName(name)} versions={versions.map((item) => item.version)} selected={selected}>
                {versions.map(({ version, measurements }) => (
                  <TabsContent key={version} value={version} data-version-panel={version} className="m-0">
                    <div className="grid divide-y divide-border xl:grid-cols-2 xl:divide-x xl:divide-y-0">
                      <MeasurementResults kind="ssr" entries={measurements.ssr} />
                      <MeasurementResults kind="lighthouse" entries={measurements.lighthouse} />
                    </div>
                  </TabsContent>
                ))}
              </VersionTabs>
            </section>
          );
        })}
      </section>
      <p className="text-xs leading-6 text-muted-foreground">버전 간 비교는 같은 시나리오·환경·측정 횟수인지 먼저 확인하세요. 빠른 점검과 병렬 점검은 각 기록에 별도로 표시합니다.</p>
    </main>
  );
}
