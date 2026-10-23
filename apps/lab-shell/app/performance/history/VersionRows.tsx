import { formatMetric } from "../data";
import type { FrameworkHistory, MeasurementEntry } from "../history-data";
import { timeDifference, timeValue, type TimeMetric } from "../history-comparison";
import MeasurementResults from "./MeasurementResults";
import TimeBar from "./TimeBar";

function VersionTime({ entry, previous, metric, limit, latest, baseline }: {
  entry: MeasurementEntry | undefined;
  previous: MeasurementEntry | undefined;
  metric: TimeMetric;
  limit: number;
  latest: boolean;
  baseline: boolean;
}) {
  const value = timeValue(entry, metric);
  const delta = timeDifference(entry, previous, metric);
  const sign = delta && delta.ms > 0 ? "+" : "";
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs text-muted-foreground lg:hidden">{metric === "contentReadyMs" ? "SSR 응답" : "LCP"} ↓</p>
      <p className="font-mono text-lg font-semibold tabular-nums sm:text-xl">
        {value === null ? "미측정" : formatMetric(value)}{value !== null && <span className="ml-1 text-[11px] font-normal text-muted-foreground">ms</span>}
      </p>
      {value !== null && <div className="mt-2.5"><TimeBar value={value} limit={limit} emphasis={latest} /></div>}
      <p data-time-difference className={`mt-2.5 text-[11px] leading-5 ${delta && delta.ms > 0 ? "text-amber-800" : delta && delta.ms < 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
        {delta ? <><span className="font-mono">{sign}{formatMetric(delta.ms)} ms</span> <span className="whitespace-nowrap">({sign}{formatMetric(delta.percent, 1)}%) {delta.ms > 0 ? "증가" : delta.ms < 0 ? "감소" : "동일"}</span></> : value === null ? "기록 없음" : baseline ? "비교 기준" : "조건 다름 · 증감 비교 제외"}
      </p>
    </div>
  );
}

export default function VersionRows({ framework, requested }: { framework: FrameworkHistory; requested?: string }) {
  const { name, versions } = framework;
  const limit = (kind: "ssr" | "lighthouse", metric: TimeMetric) => Math.max(1, ...versions.map((version) => timeValue(version.measurements[kind][0], metric) ?? 0)) * 1.1;
  return (
    <div className="mt-5">
      <div className="hidden grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_7rem] gap-x-8 border-y border-border bg-surface px-6 py-3 text-xs text-muted-foreground lg:grid">
        <p>버전 · 최신순</p><p>SSR 응답 ↓</p><p>LCP ↓</p><p>Lighthouse ↑</p>
      </div>
      <div className="divide-y divide-border">
        {versions.map(({ version, measurements }, index) => {
          const latest = version === versions[0].version;
          const previous = versions[index + 1];
          const recordCount = measurements.ssr.length + measurements.lighthouse.length;
          return (
            <article key={version} data-version-row={version} className={`grid grid-cols-2 items-start gap-x-5 gap-y-4 px-5 py-5 sm:px-6 lg:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_7rem] lg:gap-x-8 ${latest ? "bg-primary-subtle/40" : ""}`}>
              <header className="col-span-2 flex flex-wrap items-baseline gap-2 lg:col-span-1 lg:block">
                <h4 className="font-mono text-sm font-semibold">{version}</h4>
                <p className={`text-[11px] lg:mt-2 ${latest ? "text-primary" : "text-muted-foreground"}`}>{latest ? "최신 버전" : "이전 버전"}</p>
                <p className="w-full text-[10px] leading-4 text-muted-foreground lg:mt-2">{measurements.ssr[0]?.record.network?.label ?? measurements.lighthouse[0]?.record.network?.label ?? "네트워크 설정 미기록"}</p>
              </header>
              <VersionTime entry={measurements.ssr[0]} previous={previous?.measurements.ssr[0]} metric="contentReadyMs" limit={limit("ssr", "contentReadyMs")} latest={latest} baseline={!previous} />
              <VersionTime entry={measurements.lighthouse[0]} previous={previous?.measurements.lighthouse[0]} metric="lcpMs" limit={limit("lighthouse", "lcpMs")} latest={latest} baseline={!previous} />
              <div className="col-span-2 flex items-baseline gap-2 lg:col-span-1 lg:block">
                <p className="text-xs text-muted-foreground lg:hidden">Lighthouse ↑</p>
                <p className="font-mono text-sm font-semibold lg:text-xl">{measurements.lighthouse[0]?.target.medianPerformanceScore ?? "—"}<span className="ml-1 text-[11px] font-normal text-muted-foreground">/ 100</span></p>
              </div>
              <details open={requested === version} data-version-details={`${name}-${version}`} className="col-span-full min-w-0 text-xs">
                <summary className="w-fit py-1 text-muted-foreground hover:text-primary">측정 기록 {recordCount}건 · 상세 조건</summary>
                <div className="mt-3 grid divide-y divide-border overflow-hidden rounded-lg border border-border bg-white xl:grid-cols-2 xl:divide-x xl:divide-y-0">
                  <MeasurementResults kind="ssr" entries={measurements.ssr} />
                  <MeasurementResults kind="lighthouse" entries={measurements.lighthouse} />
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </div>
  );
}
