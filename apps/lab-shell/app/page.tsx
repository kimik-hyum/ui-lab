import Link from "next/link";
import LabIcon from "./components/LabIcon";
import FeaturedComparison from "./components/FeaturedComparison";
import { labExperiments, featureComparisons, featureNavigationItems } from "./lib/lab-navigation";
import {
  getPerformanceSnapshot,
  getSsrChart,
  formatMetric,
  formatSnapshotDate,
} from "./performance/data";

export default function Home() {
  const { ssr } = getPerformanceSnapshot();
  const chart = getSsrChart(ssr);
  const stats = [
    {
      label: "실험실",
      value: String(labExperiments.length).padStart(2, "0"),
      detail: "직접 만든 서비스와 UI 실험",
      icon: "flask" as const,
    },
    {
      label: "SSR 비교 프레임워크",
      value: String(ssr.targets.length).padStart(2, "0"),
      detail: "같은 시나리오, 다른 구현",
      icon: "gauge" as const,
    },
    {
      label: "기능 비교",
      value: String(featureComparisons.length).padStart(2, "0"),
      detail: "실행 결과 + 소스 코드",
      icon: "code" as const,
    },
  ];
  return (
    <main className="workspace-page space-y-7 lg:space-y-8">
      <header className="rounded-2xl border border-primary/10 bg-linear-to-br from-primary-subtle via-card to-card p-6 sm:p-8 lg:p-10">
        <div className="max-w-3xl">
          <p className="mb-2 font-mono text-[10px] font-medium tracking-[0.15em] text-primary">
            COMPARE. BUILD. MAKE IT YOURS.
          </p>
          <h1 className="text-[30px] leading-tight font-bold tracking-[-1px] sm:text-[40px] lg:text-[44px]">
            직접 비교하고,<br />
            <span className="text-primary">나만의 답을 만듭니다.</span>
          </h1>
          <p className="mt-5 text-sm font-medium text-foreground sm:text-base">
            AI의 추천에 직접 확인한 경험을 더합니다.
          </p>
          <p className="mt-2 text-[13px] leading-7 text-muted-foreground sm:text-sm">
            프레임워크와 라이브러리의 동작, 코드, 성능을 비교하며 내 프로젝트에 맞는 선택의 근거를 찾습니다.{" "}<br className="hidden sm:block" />
            그 과정에서 떠오른 아이디어는 직접 만들어, 함께 나눕니다.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#comparison-categories" className="flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-hover">
            <LabIcon name="code" className="h-4 w-4" />기술 비교하기<LabIcon name="arrow-right" className="ml-1 h-3.5 w-3.5" />
          </a>
          <Link href="/void-ui?category=standalone-services" className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary">
            <LabIcon name="flask" className="h-4 w-4" />만든 서비스 둘러보기<LabIcon name="arrow-up-right" className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <dl className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-white">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 border-r border-border px-3 py-4 last:border-0 sm:px-5 lg:px-6"
          >
            <div className="min-w-0 flex-1">
              <dt className="flex items-center gap-2 text-[10px] leading-relaxed font-medium text-muted-foreground sm:text-[11px]">
                <LabIcon
                  name={stat.icon}
                  className="hidden h-3.5 w-3.5 shrink-0 sm:block"
                />
                {stat.label}
              </dt>
              <dd className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-[24px] font-medium tracking-[-1px] text-foreground sm:text-[26px]">
                  {stat.value}
                </span>
                <span className="hidden text-[10px] text-subtle-foreground md:inline">
                  {stat.detail}
                </span>
              </dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="grid min-w-0 gap-5 min-[1180px]:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <FeaturedComparison />
        <section
          className="flex min-w-0 flex-col rounded-xl border border-border bg-white"
          aria-labelledby="snapshot-title"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 id="snapshot-title" className="text-[14px] font-semibold">
                SSR 측정 스냅샷
              </h2>
              <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                CONTENT-READY · ms
              </p>
            </div>
            <span className="rounded-md border border-border bg-surface px-2 py-1 text-[9px] font-medium text-muted-foreground">
              {ssr.runs}회 기록
            </span>
          </div>
          <div className="space-y-4 px-5 py-5">
            {chart.targets.map((target) => (
              <div key={target.name}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-medium text-foreground">
                    {target.label}
                    <span className="ml-1.5 text-[9px] font-normal text-subtle-foreground">
                      {target.mode}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-foreground">
                    {formatMetric(target.medianMetrics.contentReadyMs)}
                    <span className="ml-1 text-[9px] text-subtle-foreground">
                      ms
                    </span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${target.width}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mx-5 rounded-lg bg-surface px-3 py-2.5 text-[10px] leading-relaxed text-muted-foreground">
            {formatSnapshotDate(ssr.generatedAt)} KST · 저장된 측정값
            <br />
            저장된 조건의 관찰값입니다. 성능 순위로 해석하지 않습니다.
          </div>
          <Link
            href="/performance"
            className="mt-auto flex min-h-12 items-center justify-between px-5 text-[11px] font-semibold text-primary hover:text-primary-hover"
          >
            측정 조건과 전체 결과
            <LabIcon name="arrow-right" className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>

      <section id="workspace-areas" aria-label="작업 공간" className="grid scroll-mt-24 gap-5 md:grid-cols-2">
        <Link href="/void-ui?category=standalone-services" className="group flex flex-col rounded-xl border border-border bg-card p-6 hover:border-primary/40">
          <div className="mb-5 flex items-center justify-between"><LabIcon name="flask" className="h-6 w-6 text-primary" /><span className="font-mono text-xs text-muted-foreground">{labExperiments.length}개</span></div>
          <h2 className="text-xl font-semibold">실험실</h2>
          <p className="mt-3 text-sm font-semibold text-foreground">작은 호기심이 만든 것들</p>
          <p className="mb-6 mt-2 text-[13px] leading-6 text-muted-foreground">직접 기획하고 만든 서비스와 UI 실험을 소개합니다. 지도 편집기 Termia부터 작은 인터랙션까지, 떠오른 생각을 실제로 사용할 수 있는 모습으로 만들어갑니다.</p>
          <span className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-primary">만든 서비스 둘러보기<LabIcon name="arrow-right" className="h-4 w-4" /></span>
        </Link>
        <section id="comparison-categories" aria-labelledby="comparison-categories-title" className="flex scroll-mt-24 flex-col rounded-xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center justify-between"><LabIcon name="code" className="h-6 w-6 text-primary" /><span className="font-mono text-xs text-muted-foreground">{featureComparisons.length}개</span></div>
          <h2 id="comparison-categories-title" className="text-xl font-semibold">기능 비교</h2>
          <p className="mt-3 text-sm font-semibold text-foreground">같은 기능, 서로 다른 방법</p>
          <p className="mb-6 mt-2 text-[13px] leading-6 text-muted-foreground">직접 조작하고 코드를 나란히 읽으며, 구현 방식에 따라 달라지는 경험을 살펴봅니다.</p>
          <nav aria-label="기능 비교 카테고리" className="mt-auto grid grid-cols-2 gap-2 border-t border-border pt-4">
            {featureNavigationItems.map((item) => (
              <Link key={item.href} href={item.href} className="flex min-h-10 items-center justify-between gap-2 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary-subtle">
                {item.label}<LabIcon name="arrow-right" className="h-3.5 w-3.5 shrink-0" />
              </Link>
            ))}
          </nav>
        </section>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-5 font-mono text-[9px] text-subtle-foreground">
        <span>UI LAB / EXPERIMENT. COMPARE. UNDERSTAND.</span>
        <span className="font-sans text-xs">궁금한 것은 만들어보고, 선택에는 이유를 남깁니다.</span>
      </footer>
    </main>
  );
}
