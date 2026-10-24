import { Info } from "lucide-react";
import type { FrameworkHistory, MeasurementRecord } from "../history-data";
import { rankLatest } from "../history-comparison";

export default function MeasurementEnvironmentBox({ frameworks }: { frameworks: FrameworkHistory[] }) {
  const sources = [
    { label: "SSR", record: rankLatest(frameworks, "ssr", "contentReadyMs").record },
    { label: "Lighthouse", record: rankLatest(frameworks, "lighthouse", "lcpMs").record },
  ];
  // Show differing or missing conditions explicitly instead of implying a shared environment.
  const describe = (read: (record: MeasurementRecord | undefined) => string | undefined) => {
    const values = sources.map(({ label, record }) => ({ label, value: read(record) ?? "미기록" }));
    return new Set(values.map(({ value }) => value)).size === 1
      ? values[0].value
      : values.map(({ label, value }) => `${label} ${value}`).join(" · ");
  };
  const bandwidth = (value: number | undefined) => value === undefined ? undefined : `${value / 1000} Mbps`;
  const metrics = [
    { label: "다운로드 제한", value: describe((record) => bandwidth(record?.network?.downloadKbps)) },
    { label: "업로드 제한", value: describe((record) => bandwidth(record?.network?.uploadKbps)) },
    { label: "요청별 추가 지연", value: describe((record) => record?.network?.latencyMs === undefined ? undefined : `${record.network.latencyMs} ms`) },
  ];
  const cpu = describe((record) => {
    const multiplier = record?.network?.cpuSlowdownMultiplier;
    return multiplier === undefined ? undefined : multiplier === 1 ? "1배 · 추가 감속 없음" : `${multiplier}배`;
  });
  const runtime = describe((record) => {
    if (!record) return undefined;
    const { platform, arch, node } = record.environment;
    return [platform, arch, node && `Node.js ${node}`].filter(Boolean).join(" · ") || undefined;
  });

  return (
    <aside aria-labelledby="measurement-environment-heading" data-measurement-environment className="rounded-xl border border-primary/20 bg-primary-subtle/40 p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <h2 id="measurement-environment-heading" className="text-lg font-semibold">측정 환경과 네트워크 조건</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">최신 비교에 사용한 기록 기준 · 로컬 프로덕션 서버</p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        {metrics.map(({ label, value }) => (
          <div key={label} className="min-w-0 rounded-lg border border-primary/10 bg-white/80 px-5 py-4">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-2 break-words font-mono text-2xl font-semibold tracking-tight sm:text-3xl">{value}</dd>
          </div>
        ))}
      </dl>

      <dl className="mt-5 grid gap-x-7 gap-y-4 text-sm lg:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">측정 장비 · 실행 환경</dt>
          <dd className="mt-1.5 break-words leading-6">{describe((record) => record?.environment.cpu)}</dd>
          <dd className="break-words text-xs leading-5 text-muted-foreground">{runtime}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">반복 측정 · 사전 예열</dt>
          <dd className="mt-1.5 leading-6">{sources.map(({ label, record }) => `${label} ${record ? `${record.runs}회` : "미기록"}`).join(" · ")}</dd>
          <dd className="text-xs leading-5 text-muted-foreground">예열 {describe((record) => record?.warmup == null ? undefined : `${record.warmup}회`)} · 브라우저 CPU {cpu}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">네트워크 제한 적용 구간</dt>
          <dd className="mt-1.5 break-words text-xs leading-6">{describe((record) => record?.network?.scope)}</dd>
        </div>
      </dl>

      <p className="mt-5 border-t border-primary/10 pt-4 text-xs leading-6 text-muted-foreground">추가 지연은 실제 응답 시간에 더한 값입니다. Supabase 처리 시간과 외부 인터넷 지연은 별도로 포함됩니다. 과거 기록의 조건은 각 버전의 상세 항목에서 확인할 수 있습니다.</p>
    </aside>
  );
}
