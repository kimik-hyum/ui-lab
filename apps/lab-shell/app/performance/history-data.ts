import archive from "../../../../perf-results/history.json";
import { getTargetVersion } from "./data";

export type HistoryTarget = {
  name: string;
  versions: Partial<Record<string, string>>;
  versionEvidence: { kind: string; reference: string; commit?: string } | null;
  medianMetrics: Partial<Record<string, number | null>>;
  distribution: Partial<Record<string, { min: number | null; median: number | null; p95: number | null }>> | null;
  checklist: Record<string, boolean | null> | null;
  medianPerformanceScore: number | null;
  medianRun: number | null;
};

export type MeasurementRecord = {
  id: string;
  kind: "ssr" | "lighthouse";
  generatedAt: string;
  mode: string;
  path: string;
  runs: number;
  warmup: number | null;
  preset: string | null;
  expectedText: string | null;
  environment: { cpu?: string; platform?: string; arch?: string; node?: string; timeZone?: string };
  source: { commit: string; dirty: boolean } | null;
  network?: {
    id: string; label: string; scope: string; limitation: string; backend: string;
    downloadKbps?: number; uploadKbps?: number; latencyMs?: number; cpuSlowdownMultiplier?: number;
  };
  comparison?: { id: string; cohort: string; harnessSha256?: string };
  measurementTool?: { lighthouseVersion: string; userAgent: string };
  targets: HistoryTarget[];
};

export function getMeasurementHistory(): MeasurementRecord[] {
  return archive.records as MeasurementRecord[];
}

export type MeasurementEntry = { record: MeasurementRecord; target: HistoryTarget };
export type VersionHistory = {
  version: string;
  measurements: Record<MeasurementRecord["kind"], MeasurementEntry[]>;
};
export type FrameworkHistory = { name: string; versions: VersionHistory[] };

/** Keep independent runs inside framework → version → measurement kind. */
export function getFrameworkHistory(): FrameworkHistory[] {
  const frameworks = new Map<string, Map<string, VersionHistory>>();
  const records = [...getMeasurementHistory()].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  for (const record of records) {
    for (const target of record.targets) {
      const versions = frameworks.get(target.name) ?? new Map<string, VersionHistory>();
      const version = getTargetVersion(target.name, target.versions);
      const group = versions.get(version) ?? { version, measurements: { ssr: [], lighthouse: [] } };
      group.measurements[record.kind].push({ record, target });
      versions.set(version, group);
      frameworks.set(target.name, versions);
    }
  }
  return [...frameworks].map(([name, versions]) => ({
    name,
    versions: [...versions.values()].sort((a, b) => {
      if (a.version === "미기록") return 1;
      if (b.version === "미기록") return -1;
      return b.version.localeCompare(a.version, "en", { numeric: true });
    }),
  }));
}
