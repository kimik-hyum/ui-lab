import ssrData from "../../../../perf-results/ssr/latest.json";
import lighthouseData from "../../../../perf-results/lighthouse/latest.json";

export type SsrMetrics = {
  responseStartMs: number;
  ttfbMs: number;
  contentReadyMs: number;
  totalMs: number;
  htmlBytes: number;
};

export type MetricDistribution = {
  min: number;
  median: number;
  p95: number;
};

export type MeasurementEnvironment = {
  node: string;
  platform: string;
  arch: string;
  cpu: string;
  timeZone: string;
};

export type SsrTarget = {
  name: string;
  versions?: Partial<Record<string, string>>;
  url: string;
  checklist: {
    statusOk: boolean;
    expectedTextOk: boolean;
    contentReadyOk: boolean;
  };
  medianMetrics: SsrMetrics;
  distribution: Record<keyof SsrMetrics, MetricDistribution>;
  streamingDeltaMs: number;
};

export type SsrSnapshot = {
  generatedAt: string;
  path: string;
  runs: number;
  minRuns: number;
  warmup: number;
  expectedText: string;
  network?: { label: string; limitation: string } | null;
  environment: MeasurementEnvironment;
  targets: SsrTarget[];
};

export type LighthouseSnapshot = {
  generatedAt: string;
  path: string;
  runs: number;
  preset: string;
  network?: { label: string; limitation: string } | null;
  environment: MeasurementEnvironment;
  targets: {
    name: string;
    versions?: Partial<Record<string, string>>;
    medianPerformanceScore: number;
    medianMetrics: {
      fcpMs: number;
      lcpMs: number;
      tbtMs: number;
      cls: number;
      speedIndexMs: number;
      inpMs: number | null;
    };
  }[];
};

/** Checked-in snapshots are bundled, including in Next.js standalone deployments. */
export function getPerformanceSnapshot(): {
  ssr: SsrSnapshot;
  lighthouse: LighthouseSnapshot;
} {
  return { ssr: ssrData, lighthouse: lighthouseData };
}

const targetNames: Record<string, string> = {
  "next-lab": "Next.js",
  "sveltekit-lab": "SvelteKit",
  "vue-lab": "Nuxt",
  "react-router-lab": "React Router",
};

export function getTargetDisplayName(name: string) {
  return targetNames[name] ?? name;
}

const frameworkPackages: Record<string, string> = {
  "next-lab": "next",
  "sveltekit-lab": "@sveltejs/kit",
  "vue-lab": "nuxt",
  "react-router-lab": "react-router",
};

export function getTargetVersion(name: string, versions: Partial<Record<string, string>> = {}) {
  return versions[frameworkPackages[name]] ?? "미기록";
}

/** Modes describe the checked-in shopping-detail scenario, not timing heuristics. */
export function getTargetMode(name: string, scenarioPath: string) {
  if (scenarioPath !== "/scenarios/shopping-detail-ssr") return "미기록";
  if (name === "next-lab") return "Streaming";
  if (name in targetNames) return "Blocking";
  return "미기록";
}

export function formatSnapshotDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export function formatMetric(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function getSsrChart(snapshot: SsrSnapshot) {
  const maximum = Math.max(...snapshot.targets.map((target) => target.medianMetrics.contentReadyMs), 1);
  const limit = Math.ceil(maximum / 25) * 25;
  return {
    limit,
    ticks: [0, 0.25, 0.5, 0.75, 1].map((fraction) => limit * fraction),
    targets: snapshot.targets.map((target) => ({
      ...target,
      label: getTargetDisplayName(target.name),
      version: getTargetVersion(target.name, target.versions),
      mode: getTargetMode(target.name, snapshot.path),
      width: (target.medianMetrics.contentReadyMs / limit) * 100,
    })),
  };
}

export const performanceSources = {
  ssr: "/performance/export?kind=ssr",
  lighthouse: "/performance/export?kind=lighthouse",
  methodology: "https://github.com/kimik-hyum/ui-lab/blob/main/docs/harness/performance-methodology.md",
  result: "https://github.com/kimik-hyum/ui-lab/blob/main/docs/harness/results/shopping-detail-ssr.md",
};
