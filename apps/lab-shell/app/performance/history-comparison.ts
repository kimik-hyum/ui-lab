import type { FrameworkHistory, MeasurementEntry, MeasurementRecord } from "./history-data";

export type TimeMetric = "contentReadyMs" | "lcpMs";

export function timeValue(entry: MeasurementEntry | undefined, metric: TimeMetric) {
  const value = entry?.target.medianMetrics[metric];
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function isValid(entry: MeasurementEntry) {
  return entry.record.runs >= (entry.record.kind === "ssr" ? 20 : 5) &&
    entry.record.mode !== "parallel" &&
    (entry.record.kind === "ssr"
      ? entry.target.checklist !== null && Object.keys(entry.target.checklist).length > 0 && Object.values(entry.target.checklist).every((value) => value === true)
      : entry.target.medianPerformanceScore !== null);
}

/** Cross-run comparisons require the recorded, matching experiment conditions. */
export function sameConditions(a: MeasurementEntry, b: MeasurementEntry) {
  if (!isValid(a) || !isValid(b)) return false;
  const left = a.record;
  const right = b.record;
  if (left.kind !== right.kind) return false;
  if (left.id === right.id) return true;
  if (!left.network || !left.comparison?.harnessSha256 || !right.comparison?.harnessSha256) return false;
  return left.comparison.id === right.comparison.id &&
    left.comparison.harnessSha256 === right.comparison.harnessSha256 &&
    left.path === right.path && left.mode === right.mode && left.runs === right.runs &&
    left.warmup === right.warmup && left.preset === right.preset && left.expectedText === right.expectedText &&
    JSON.stringify(left.network) === JSON.stringify(right.network) &&
    JSON.stringify(left.environment) === JSON.stringify(right.environment) &&
    JSON.stringify(left.measurementTool) === JSON.stringify(right.measurementTool);
}

export function timeDifference(current: MeasurementEntry | undefined, previous: MeasurementEntry | undefined, metric: TimeMetric) {
  if (!current || !previous || current.target.name !== previous.target.name || !sameConditions(current, previous)) return null;
  const before = timeValue(previous, metric);
  const after = timeValue(current, metric);
  if (before === null || after === null || before <= 0) return null;
  return { ms: after - before, percent: (after - before) / before * 100 };
}

export function rankLatest(frameworks: FrameworkHistory[], kind: MeasurementRecord["kind"], metric: TimeMetric) {
  const candidates = frameworks.flatMap(({ name, versions }) => {
    const latest = versions[0];
    const entry = latest?.measurements[kind][0];
    const value = timeValue(entry, metric);
    return entry && value !== null && isValid(entry) ? [{ name, version: latest.version, entry, value }] : [];
  });
  const reference = [...candidates].sort((a, b) => b.entry.record.generatedAt.localeCompare(a.entry.record.generatedAt))[0];
  const rows = reference ? candidates.filter((row) => sameConditions(reference.entry, row.entry)).sort((a, b) => a.value - b.value) : [];
  return { rows, excluded: frameworks.length - rows.length, record: reference?.entry.record };
}
