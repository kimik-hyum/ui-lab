import type { Metadata } from "next";
import Link from "next/link";
import { getTargetDisplayName } from "../data";
import { getFrameworkHistory } from "../history-data";
import LatestRanking from "./LatestRanking";
import VersionRows from "./VersionRows";
import FrameworkComments from "./FrameworkComments";
import MeasurementEnvironmentBox from "./MeasurementEnvironmentBox";

export const metadata: Metadata = {
  title: "버전별 성능 기록",
  description: "최신 버전 결과를 한눈에 보고, 프레임워크와 버전별로 SSR·Lighthouse 기록을 확인합니다.",
};

const frameworkOrder: Readonly<Record<string, number>> = {
  "next-lab": 0,
  "react-router-lab": 1,
  "sveltekit-lab": 2,
  "vue-lab": 3,
};

export default async function PerformanceHistoryPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const frameworks = getFrameworkHistory().sort((a, b) =>
    (frameworkOrder[a.name] ?? 4) - (frameworkOrder[b.name] ?? 4));

  return (
    <main className="min-w-0 space-y-10 px-4 py-6 sm:px-7 lg:px-9 lg:py-8 2xl:px-12">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-7">
        <div>
          <p className="mb-2 font-mono text-[11px] font-medium tracking-[0.16em] text-primary">PERFORMANCE HISTORY</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">버전별 측정 기록</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">최신 버전의 속도를 비교하고, 버전업 전후에 달라진 시간을 한눈에 확인하세요.</p>
        </div>
        <Link href="/performance" className="inline-flex min-h-10 items-center rounded-lg border border-border bg-white px-4 text-xs font-medium hover:border-primary hover:text-primary">최신 결과 상세 비교 →</Link>
      </header>

      <MeasurementEnvironmentBox frameworks={frameworks} />
      <LatestRanking frameworks={frameworks} />

      <section aria-labelledby="framework-history-heading" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 id="framework-history-heading" className="text-lg font-semibold">프레임워크별 · 버전 변화</h2>
            <p className="mt-1 text-sm text-muted-foreground">최신 버전부터 표시합니다. 증감은 바로 이전 버전의 같은 조건 기록과 비교합니다.</p>
          </div>
          <nav aria-label="프레임워크 바로가기" className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
            {frameworks.map(({ name }) => <Link key={name} href={`#${name}`} className="inline-flex min-h-9 items-center hover:text-primary">{getTargetDisplayName(name)}</Link>)}
          </nav>
        </div>

        {frameworks.map(({ name, versions }, index) => {
          const requested = first(query[`version.${name}`]) ?? (first(query.framework) === name ? first(query.version) : undefined);
          return (
            <section key={name} id={name} data-framework-section={name} aria-labelledby={`${name}-heading`} className="min-w-0 scroll-mt-24 overflow-hidden rounded-xl border border-border bg-white">
              <header className="flex items-center justify-between gap-4 px-5 pb-2 pt-6 sm:px-6">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-surface font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  <h3 id={`${name}-heading`} className="text-xl font-semibold tracking-tight">{getTargetDisplayName(name)}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{versions.length}개 버전</p>
              </header>
              <VersionRows framework={{ name, versions }} requested={requested} />
              <FrameworkComments framework={name} />
            </section>
          );
        })}
      </section>
      <p className="text-xs leading-6 text-muted-foreground">SSR·LCP는 낮을수록, Lighthouse 점수는 높을수록 좋습니다. 막대는 0부터 시작하며 지표별 눈금을 공유합니다. 조건이 다른 기록은 증감 비교에서 제외하고, 과거 측정과 세부 조건은 각 버전 아래에 보관합니다.</p>
    </main>
  );
}
