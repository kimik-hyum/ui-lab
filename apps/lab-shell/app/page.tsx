import Link from "next/link";
import LabIcon from "./components/LabIcon";
import FeaturedComparison from "./components/FeaturedComparison";
import ExperimentExplorer from "./components/ExperimentExplorer";
import { experiments } from "./lib/lab-navigation";
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
      label: "실행 가능한 실험",
      value: String(experiments.length).padStart(2, "0"),
      detail: "React · Next.js · UI",
      icon: "flask" as const,
    },
    {
      label: "SSR 비교 프레임워크",
      value: String(ssr.targets.length).padStart(2, "0"),
      detail: "같은 시나리오, 다른 구현",
      icon: "gauge" as const,
    },
    {
      label: "기능 적용 전후 비교",
      value: String(
        experiments.filter((item) => item.category !== "UI").length,
      ).padStart(2, "0"),
      detail: "실행 결과 + 소스 코드",
      icon: "code" as const,
    },
  ];
  return (
    <main className="workspace-page space-y-7 lg:space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 font-mono text-[10px] font-medium tracking-[0.15em] text-accent">
            YOUR FRONTEND WORKBENCH
          </p>
          <h1 className="text-[28px] font-bold tracking-[-0.9px] sm:text-[31px]">
            실험실 개요<span className="ml-2 text-accent">.</span>
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            SSR 성능부터 새로운 UI 패턴까지. 실행하고, 비교하고, 이해하세요.
          </p>
        </div>
        <a
          href="#experiments"
          className="flex min-h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-xs font-medium text-white transition-colors hover:bg-slate-700"
        >
          <LabIcon name="flask" className="h-4 w-4" />
          실험 둘러보기
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
                    className="h-full rounded-full bg-[#7eaaa0]"
                    style={{ width: `${target.width}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mx-5 rounded-lg bg-surface px-3 py-2.5 text-[10px] leading-relaxed text-muted-foreground">
            {formatSnapshotDate(ssr.generatedAt)} KST · 저장된 측정값
            <br />
            단일 실행 결과입니다. 상세 조건을 함께 확인하세요.
          </div>
          <Link
            href="/performance"
            className="mt-auto flex min-h-12 items-center justify-between px-5 text-[11px] font-semibold text-accent hover:text-accent-hover"
          >
            측정 조건과 전체 결과
            <LabIcon name="arrow-right" className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>

      <ExperimentExplorer />

      <section className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-border bg-white p-5">
        <div className="flex items-start gap-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent">
            <LabIcon name="book" className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 className="text-[13px] font-semibold">실험에서 발견한 것들</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              새로운 기능의 적용 가능성과 검증 근거를 리포트로 살펴보세요.
            </p>
          </div>
        </div>
        <Link
          href="/reports"
          className="flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-[11px] font-medium text-foreground hover:bg-surface"
        >
          검증 리포트 읽기
          <LabIcon name="arrow-up-right" className="h-3.5 w-3.5" />
        </Link>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-5 font-mono text-[9px] text-subtle-foreground">
        <span>UI LAB / EXPERIMENT. COMPARE. UNDERSTAND.</span>
        <span>Built to explore the web.</span>
      </footer>
    </main>
  );
}
