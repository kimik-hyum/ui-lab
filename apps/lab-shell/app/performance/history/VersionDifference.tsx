import { formatMetric, getTargetVersion } from "../data";
import { getMeasurementHistory, type MeasurementRecord } from "../history-data";

function matchedPair(name: string, kind: MeasurementRecord["kind"]) {
  const records = getMeasurementHistory();
  const current = records.find((record) => record.kind === kind && record.comparison?.cohort === "current" && record.targets.some((target) => target.name === name));
  if (!current?.network || !current.comparison?.harnessSha256) return null;
  const comparison = current.comparison;
  const before = records.find((record) => record.kind === kind && record.comparison?.cohort === "before" &&
    record.comparison.id === comparison.id && record.comparison.harnessSha256 === comparison.harnessSha256 &&
    JSON.stringify(record.network) === JSON.stringify(current.network) && record.path === current.path &&
    record.runs === current.runs && record.warmup === current.warmup && record.preset === current.preset &&
    record.expectedText === current.expectedText && JSON.stringify(record.environment) === JSON.stringify(current.environment) &&
    JSON.stringify(record.measurementTool) === JSON.stringify(current.measurementTool) && record.targets.some((target) => target.name === name));
  if (!before) return null;
  return { before: before.targets.find((target) => target.name === name)!, current: current.targets.find((target) => target.name === name)! };
}

function difference(before: number | null | undefined, current: number | null | undefined) {
  if (typeof before !== "number" || typeof current !== "number" || before <= 0) return "미측정";
  const percent = ((current - before) / before) * 100;
  return `${percent > 0 ? "+" : ""}${formatMetric(percent, 1)}%`;
}

export default function VersionDifference({ name }: { name: string }) {
  const ssr = matchedPair(name, "ssr");
  const lighthouse = matchedPair(name, "lighthouse");
  const pair = ssr ?? lighthouse;
  if (!pair) return null;
  return (
    <div data-version-difference className="mx-5 mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-lg bg-surface px-4 py-3 text-xs sm:mx-6">
      <p className="text-muted-foreground">동일 제한 조건 · <span className="font-mono">{getTargetVersion(name, pair.before.versions)} → {getTargetVersion(name, pair.current.versions)}</span></p>
      <p className="flex flex-wrap gap-x-5 gap-y-2 font-medium">
        {ssr && <span>SSR <span className="font-mono">{difference(ssr.before.medianMetrics.contentReadyMs, ssr.current.medianMetrics.contentReadyMs)}</span></span>}
        {lighthouse && <span>LCP <span className="font-mono">{difference(lighthouse.before.medianMetrics.lcpMs, lighthouse.current.medianMetrics.lcpMs)}</span></span>}
        <span className="font-normal text-muted-foreground">시간 차이 · 음수일수록 빠름</span>
      </p>
    </div>
  );
}
