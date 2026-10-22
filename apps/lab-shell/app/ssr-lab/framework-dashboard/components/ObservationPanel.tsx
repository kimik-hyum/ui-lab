import type { FrameworkId } from "../_lib/types";
import { FRAMEWORK_PRESENTATION, type Observation } from "../presentation";
import { HtmlSnapshot } from "./HtmlSnapshot";

function time(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}ms`;
}

export function ObservationPanel({ framework, result, snapshotCss }: {
  framework: FrameworkId;
  result?: Observation;
  snapshotCss: string;
}) {
  const info = FRAMEWORK_PRESENTATION[framework];
  if (!result) return <div className="rounded-lg border border-slate-200 bg-slate-50 p-5" role="status"><p className="text-sm text-slate-700">{info.label} 서버 응답을 기다리는 중…</p><p className="mt-2 text-xs text-slate-500">같은 조건으로 HTML을 요청합니다.</p></div>;
  if (result.kind === "network-error") return <div className="rounded-lg border border-red-200 bg-red-50 p-5" role="alert"><p className="text-sm text-red-600">{result.message}</p></div>;
  const response = result.value;
  if (!response.ok) return <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-5" role="status" data-observer-error={response.error.code}>
    <p className="text-sm font-medium text-slate-800">{response.upstreamStatus === null ? "서버 응답을 확인하지 못했습니다." : `HTTP ${response.upstreamStatus}`}</p>
    <p className="text-sm leading-6 text-slate-600">{response.error.message}</p>
    <p className="text-xs leading-5 text-slate-500">조건을 바꾸거나 다시 실행할 수 있습니다. 응답이 없으면 관찰값을 표시하지 않습니다.</p>
  </div>;

  return <div className="space-y-4" data-observer-result={framework}>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
      <span>{response.source.label} · 설치 버전 {response.source.version}</span>
      <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-600">HTTP 200 · 일괄 SSR</span>
    </div>
    <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div><dt className="text-xs text-slate-500">핵심 콘텐츠 도착</dt><dd className="mt-1 text-xl font-semibold text-slate-800" data-content-ready>{time(response.metrics.contentReadyMs)}</dd></div>
      <div><dt className="text-xs text-slate-500">응답 완료</dt><dd className="mt-1 text-xl font-semibold text-slate-800">{time(response.metrics.totalMs)}</dd></div>
    </dl>
    <p className="text-xs text-slate-500">응답 본문 {(response.metrics.htmlBytes / 1024).toFixed(1)} KiB · 압축된 네트워크 전송량은 아닙니다.</p>
    <HtmlSnapshot html={response.html} css={snapshotCss} label={info.label} />
  </div>;
}
