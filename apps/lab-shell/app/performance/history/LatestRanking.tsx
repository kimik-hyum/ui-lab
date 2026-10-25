import Link from "next/link";
import { formatMetric, formatSnapshotDate, getTargetDisplayName, getTargetMode, sortFrameworks } from "../data";
import type { FrameworkHistory } from "../history-data";
import { rankLatest } from "../history-comparison";
import TimeBar from "./TimeBar";

export default function LatestRanking({ frameworks }: { frameworks: FrameworkHistory[] }) {
  const charts = [
    { key: "ssr", title: "SSR · 콘텐츠 도착", description: "서버에서 핵심 콘텐츠가 도착하기까지", ...rankLatest(frameworks, "ssr", "contentReadyMs"), step: 50 },
    { key: "lighthouse", title: "LCP · 화면 표시", description: "화면의 가장 큰 콘텐츠가 표시되기까지", ...rankLatest(frameworks, "lighthouse", "lcpMs"), step: 500 },
  ];
  return (
    <section aria-labelledby="latest-versions-heading" data-latest-versions>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="latest-versions-heading" className="text-lg font-semibold">최신 버전 · 측정 결과 비교</h2>
        <p className="text-xs text-muted-foreground">프레임워크 고정 순서 · 단위 ms</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {charts.map(({ key, title, description, rows, excluded, mixedConditions, step }) => {
          const limit = Math.max(step, Math.ceil(Math.max(...rows.map((row) => row.value), 0) / step) * step);
          const best = mixedConditions ? undefined : rows[0]?.value;
          return (
            <section key={key} aria-labelledby={`ranking-${key}`} data-ranking={key} className="min-w-0 rounded-xl border border-border bg-white p-5 sm:p-6">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 id={`ranking-${key}`} className="font-semibold">{title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <ul className="space-y-5">
                {sortFrameworks(rows).map(({ name, version, value, entry }) => (
                  <li key={name} data-ranked-framework={name} data-time={value}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                        <Link href={`#${name}`} className="text-sm font-semibold hover:text-primary">{getTargetDisplayName(name)}</Link>
                        <span className="font-mono text-[11px] text-muted-foreground">{version}</span>
                        <span className="text-[10px] text-muted-foreground">{getTargetMode(name, entry.record.path, entry.target.renderingMode)}</span>
                      </div>
                      <p className="shrink-0 font-mono text-sm font-semibold tabular-nums">{formatMetric(value)} <span className="text-[10px] font-normal text-muted-foreground">ms</span></p>
                    </div>
                    <TimeBar value={value} limit={limit} emphasis={value === best} />
                  </li>
                ))}
              </ul>
              <div aria-hidden="true" className="mt-3 flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>0</span><span>{formatMetric(limit / 2, 0)}</span><span>{formatMetric(limit, 0)} ms</span>
              </div>
              <div className="mt-5 border-t border-border pt-3 text-[11px] leading-5 text-muted-foreground">
                <p>{key === "ssr" ? "콘텐츠 도착 중앙값" : "점수 중앙 실행의 LCP"}</p>
                <details className="mt-2">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 font-medium text-primary [&::-webkit-details-marker]:hidden">
                    <span>측정 조건 보기</span>
                    <span className="font-normal text-muted-foreground">{mixedConditions ? "조건 차이 있음" : "동일 조건"}</span>
                  </summary>
                  <div className="mt-3 space-y-3 rounded-lg bg-surface p-3">
                    {mixedConditions && <p>측정 시점과 조건이 다른 최신 기록입니다. 가장 빠른 결과의 강조는 적용하지 않습니다.</p>}
                    <ul className="space-y-3">
                      {sortFrameworks(rows).map(({ name, entry }) => (
                        <li key={name}>
                          <p className="font-medium text-foreground">{getTargetDisplayName(name)}</p>
                          <p>{formatSnapshotDate(entry.record.generatedAt)} KST · {entry.record.runs}회</p>
                          <p>{entry.record.network?.label ?? "네트워크 미기록"} · Node {entry.record.environment.node ?? "미기록"}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
                {excluded > 0 && <p className="text-amber-700">이 시나리오의 유효한 최신 기록이 없는 {excluded}개 프레임워크는 표시하지 않았습니다.</p>}
              </div>
            </section>
          );
        })}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">각 프레임워크의 최신 버전에서 측정한 상품 상세 결과입니다. 일부만 다시 측정하면 나머지는 기존 최신 기록을 유지합니다. 실제 Supabase와 외부 이미지 서버의 응답 변동도 포함됩니다.</p>
    </section>
  );
}
