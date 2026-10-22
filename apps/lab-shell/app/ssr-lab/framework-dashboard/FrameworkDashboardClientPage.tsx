"use client";

import { useEffect, useMemo, useState } from "react";
import { ComparisonTemplate } from "../../front-feature/components/ComparisonTemplate";
import { ComparisonTopicNotes } from "../../front-feature/components/ComparisonTopicNotes";
import { FRAMEWORK_IDS, type FrameworkId, type ObserverRequest } from "./_lib/types";
import { FRAMEWORK_PRESENTATION, type Observation } from "./presentation";
import { SOURCE_SCOPES, type ComparisonSources, type SourceScopeId } from "./source-catalog";
import { dashboardSourceTopics } from "./source-topics";
import { serializeDashboardConditions, type DashboardConditions } from "./dashboard-conditions";
import { SourceScopeGuide } from "./components/SourceScopeGuide";
import { ObservationPanel } from "./components/ObservationPanel";
import { requestObservation } from "./request-observation";
import styles from "./framework-dashboard.module.css";

type Side = "left" | "right";
type Selection = ObserverRequest & { left: FrameworkId; right: FrameworkId; run: number };
type Results = { key: string; values: Partial<Record<Side, Observation>> };

export function FrameworkDashboardClientPage({ sources, snapshotCss, initialConditions }: { sources: ComparisonSources; snapshotCss: string; initialConditions: DashboardConditions }) {
  const { scope: initialScope, ...initialSelection } = initialConditions;
  const [selection, setSelection] = useState<Selection>({ ...initialSelection, run: 0 });
  const [scope, setScope] = useState<SourceScopeId>(initialScope);
  const [results, setResults] = useState<Results | null>(null);
  const { left, right, team, delayMs, run } = selection;
  const requestKey = `${left}:${right}:${team}:${delayMs}:${run}`;
  const current = results?.key === requestKey ? results.values : {};

  useEffect(() => {
    const search = serializeDashboardConditions({ left, right, team, delayMs, scope });
    const url = new URL(window.location.href);
    if (url.search.slice(1) !== search) {
      url.search = search;
      window.history.replaceState(window.history.state, "", url);
    }
    // The preview owns its hash route. Send only normalized experiment conditions.
    if (window.parent !== window) window.parent.postMessage({ type: "ui-lab:dashboard-conditions", search }, window.location.origin);
  }, [left, right, team, delayMs, scope]);

  useEffect(() => {
    const controller = new AbortController();
    for (const [side, framework] of [["left", left], ["right", right]] as const) {
      async function observe() {
        const observation = await requestObservation(framework, { team, delayMs }, controller.signal);
        if (!observation || controller.signal.aborted) return;
        setResults((previous) => ({ key: requestKey, values: { ...(previous?.key === requestKey ? previous.values : {}), [side]: observation } }));
      }
      void observe();
    }
    return () => controller.abort();
  }, [left, right, team, delayMs, requestKey]);

  const topics = useMemo(() => dashboardSourceTopics(scope, left, right, sources), [scope, left, right, sources]);

  return <ComparisonTemplate
    title="프레임워크별 서버 HTML"
    description="같은 팀 대시보드를 네 프레임워크의 기본 서버 데이터 로딩 방식으로 준비합니다."
    leftTitle={`${FRAMEWORK_PRESENTATION[left].label} · ${FRAMEWORK_PRESENTATION[left].boundary}`}
    rightTitle={`${FRAMEWORK_PRESENTATION[right].label} · ${FRAMEWORK_PRESENTATION[right].boundary}`}
    leftCode={sources[left][scope].code}
    rightCode={sources[right][scope].code}
    topics={topics}
    headerActions={<div className={`${styles.controls} flex flex-wrap items-end gap-3`}>
      {(["left", "right"] as const).map((side) => <label key={side} className="flex flex-col gap-1 text-xs text-slate-500">{side === "left" ? "왼쪽" : "오른쪽"}<select aria-label={`${side === "left" ? "왼쪽" : "오른쪽"} 프레임워크`} value={selection[side]} onChange={(event) => setSelection((previous) => ({ ...previous, [side]: event.target.value as FrameworkId }))} className="rounded border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700">{FRAMEWORK_IDS.map((id) => <option key={id} value={id} disabled={id === selection[side === "left" ? "right" : "left"]}>{FRAMEWORK_PRESENTATION[id].label}</option>)}</select></label>)}
      <label className="flex flex-col gap-1 text-xs text-slate-500">서버 인공지연<select aria-label="공통 서버 지연" value={delayMs} onChange={(event) => setSelection((previous) => ({ ...previous, delayMs: Number(event.target.value) as ObserverRequest["delayMs"] }))} className="rounded border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700"><option value={0}>0ms</option><option value={400}>400ms</option><option value={800}>800ms</option></select></label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">데이터<select aria-label="대시보드 데이터 상태" value={team} onChange={(event) => setSelection((previous) => ({ ...previous, team: event.target.value as ObserverRequest["team"] }))} className="rounded border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700"><option value="alpha">알파 팀</option><option value="empty">빈 팀</option><option value="missing">없는 팀 · 404</option></select></label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">코드에서 볼 범위<select aria-label="코드에서 볼 범위" value={scope} onChange={(event) => setScope(event.target.value as SourceScopeId)} className="rounded border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700">{Object.entries(SOURCE_SCOPES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label>
      <button type="button" onClick={() => setSelection((previous) => ({ ...previous, run: previous.run + 1 }))} className="rounded border border-violet-600 bg-violet-600 px-3 py-2 text-sm text-white">두 응답 다시 확인</button>
    </div>}
    leftComponent={<ObservationPanel framework={left} result={current.left} snapshotCss={snapshotCss} />}
    rightComponent={<ObservationPanel framework={right} result={current.right} snapshotCss={snapshotCss} />}
    footer={<div className="space-y-5 p-5 text-sm leading-7 text-slate-600">
      <p><strong>관찰 범위:</strong> UI-LAB 서버에서 프레임워크 서버로 요청한 한 번의 HTML 응답입니다. 핵심 콘텐츠 끝의 마커가 도착한 시각을 표시합니다. 브라우저 표시·hydration·사용자 네트워크 시간은 포함하지 않으며, 이 값으로 성능 순위를 정하지 않습니다.</p>
      <p>미리보기는 응답에서 추출한 본문에 공통 스타일을 적용합니다. 스크립트는 실행하지 않습니다. 코드 화면을 오가는 동안에는 같은 관찰 결과를 유지합니다.</p>
      <SourceScopeGuide scope={scope} left={left} right={right} sources={sources} onScopeChange={setScope} />
      {team === "missing" && <p>없는 팀도 같은 서버 지연 후 404로 처리합니다. 이 경로는 오류 처리 방식을 확인하며 성능 수치는 표시하지 않습니다.</p>}
      <ComparisonTopicNotes topics={topics} />
      <nav aria-label={scope === "errors" ? "공식 오류 처리 문서" : "공식 서버 데이터 문서"} className="flex flex-wrap gap-x-6 gap-y-2 text-xs">{[left, right].map((id) => <a key={id} href={scope === "errors" ? FRAMEWORK_PRESENTATION[id].errorDocs : FRAMEWORK_PRESENTATION[id].docs} target="_blank" rel="noreferrer" className="underline underline-offset-4">{FRAMEWORK_PRESENTATION[id].label} {scope === "errors" ? "오류 처리" : "서버 데이터"} 문서 ↗</a>)}</nav>
    </div>}
  />;
}
