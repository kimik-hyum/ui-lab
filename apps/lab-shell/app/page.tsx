import Link from "next/link";
import LabIcon from "./components/LabIcon";
import FeaturedComparison from "./components/FeaturedComparison";
import { labExperiments, featureComparisons } from "./lib/lab-navigation";
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
      detail: "직접 구상한 아이디어 구현",
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
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 font-mono text-[10px] font-medium tracking-[0.15em] text-primary">
            YOUR FRONTEND WORKBENCH
          </p>
          <h1 className="text-[28px] font-bold tracking-[-0.9px] sm:text-[31px]">
            프로젝트 개요<span className="ml-2 text-primary">.</span>
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            아이디어는 실험실에서 구현하고, 기술의 차이는 기능 비교에서 확인합니다.
          </p>
        </div>
        <a
          href="#workspace-areas"
          className="flex min-h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-xs font-medium text-white transition-colors hover:bg-slate-700"
        >
          <LabIcon name="flask" className="h-4 w-4" />
          작업 공간 둘러보기
          <LabIcon name="arrow-right" className="ml-1 h-3.5 w-3.5" />
        </a>
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
        {[
          { title: "실험실", href: "/void-ui", icon: "flask" as const, count: labExperiments.length, description: "직접 구상한 아이디어를 UI로 구현합니다.", detail: "무한스크롤 · URL 페이지 복원", action: "아이디어 구현 보기" },
          { title: "기능 비교", href: "/front-feature", icon: "code" as const, count: featureComparisons.length, description: "같은 문제를 푸는 구현의 실행 결과와 코드를 비교합니다.", detail: "React · Next.js · 라이브러리 · SSR", action: "코드 비교 보기" },
        ].map((area) => <Link key={area.href} href={area.href} className="group rounded-xl border border-border bg-card p-6 hover:border-primary/40">
          <div className="mb-5 flex items-center justify-between"><LabIcon name={area.icon} className="h-6 w-6 text-primary" /><span className="font-mono text-xs text-muted-foreground">{area.count}개</span></div>
          <h2 className="text-xl font-semibold">{area.title}</h2><p className="mt-2 text-sm text-muted-foreground">{area.description}</p>
          <p className="mt-3 text-xs text-muted-foreground">{area.detail}</p>
          <span className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-primary">{area.action}<LabIcon name="arrow-right" className="h-4 w-4" /></span>
        </Link>)}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-5 font-mono text-[9px] text-subtle-foreground">
        <span>UI LAB / EXPERIMENT. COMPARE. UNDERSTAND.</span>
        <span>Built to explore the web.</span>
      </footer>
    </main>
  );
}
