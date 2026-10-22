'use client';

import { useMemo, useState } from "react";
import { ComparisonTemplate } from "../../components/ComparisonTemplate";
import { ComparisonTopicNotes } from "../../components/ComparisonTopicNotes";
import { collectAnchorLines, resolveTopicLines } from "../../components/codeAnchors";
import type { ComparisonTopic } from "../../components/ComparisonTypes";
import { PREVIEW_ROW_COUNT, WORKLOAD_OPTIONS } from "./constants";
import type { PreviewWorkload } from "./types";
import { ImmediatePreview } from "./components/ImmediatePreview";
import { DeferredPreview } from "./components/DeferredPreview";
import styles from "./deferred-value.module.css";

const TOPICS = [
  { id: "input", title: "입력값은 바로 갱신", description: "양쪽 모두 입력 상태를 즉시 바꿉니다. 오른쪽도 input에는 최신 text를 연결하므로 타이핑 자체를 지연하지 않습니다.", left: [15, 16], right: [16, 17] },
  { id: "priority", title: "느린 목록만 뒤따라 갱신", description: "왼쪽은 입력과 목록이 함께 갱신됩니다. 오른쪽은 목록에 deferredText를 전달해 새 입력이 느린 렌더링보다 우선하도록 합니다. 고정 대기 시간이나 debounce가 아닙니다.", left: [11, 22, 23, 24], right: [11, 23, 24, 25] },
  { id: "memo", title: "같은 목록은 건너뛰기", description: "공통 목록의 memo는 props가 같으면 느린 행 렌더링을 건너뛸 수 있게 합니다. 오른쪽은 이전 목록을 유지한 채 입력을 먼저 보여주고, 두 값이 다른 동안 갱신 중임을 표시합니다. 목록 렌더 자체가 빨라지거나 전체 작업이 줄어든다는 보장은 없습니다.", left: [38, 39, 40, 41, 42, 43, 44], right: [12, 22, 39, 40, 41, 42, 43, 44, 45] },
];

export function DeferredValueClientPage({ immediateCode, deferredCode }: { immediateCode: string; deferredCode: string }) {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [workload, setWorkload] = useState<PreviewWorkload>("1.5");
  const topics = useMemo<ComparisonTopic[]>(() => {
    const left = collectAnchorLines(immediateCode);
    const right = collectAnchorLines(deferredCode);
    return TOPICS.map((topic) => ({
      id: topic.id, title: topic.title, description: <p>{topic.description}</p>,
      leftLines: resolveTopicLines([topic.id], left, topic.left),
      rightLines: resolveTopicLines(topic.id === "memo" ? ["memo", "stale"] : [topic.id], right, topic.right),
    }));
  }, [immediateCode, deferredCode]);

  return (
    <ComparisonTemplate
      title="useDeferredValue · 입력과 느린 목록의 우선순위"
      description="양쪽 입력란에 같은 문구를 연속해서 입력해보세요. 입력값과 목록 기준값이 언제 함께 바뀌는지 관찰합니다."
      leftTitle="즉시 반영 · 같은 우선순위" rightTitle="useDeferredValue · 입력 우선"
      leftCode={immediateCode} rightCode={deferredCode} topics={topics}
      headerActions={<div className={`${styles.controls} flex flex-wrap items-center gap-2 text-xs`}><label className="flex flex-wrap items-center gap-2 text-slate-600">작업 조건<select aria-label="미리보기 작업 조건" value={workload} onChange={(event) => setWorkload(event.target.value === "0" ? "0" : "1.5")} className="min-h-11 max-w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700">{WORKLOAD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><button onClick={() => { setLeftText(""); setRightText(""); }} className="min-h-11 rounded-lg border border-slate-300 px-3 text-slate-600">양쪽 비우기</button></div>}
      leftComponent={<ImmediatePreview text={leftText} onTextChange={setLeftText} workload={workload} />}
      rightComponent={<DeferredPreview text={rightText} onTextChange={setRightText} workload={workload} />}
      footer={<div className="space-y-3 p-6 text-sm leading-relaxed text-slate-500"><p>같은 {PREVIEW_ROW_COUNT}행에 문구를 표시하는 로컬 시연입니다. 검색이나 API 요청은 없습니다. 1.5ms는 행별 인공 작업의 목표 시간이며 실측 성능 수치가 아닙니다. 서버·빈 문구·일반 목록에서는 인공 작업을 생략합니다.</p><p>각 행을 별도 컴포넌트로 나눠 React가 렌더링 도중 새 입력에 양보할 수 있게 합니다. UI·코드를 오가도 입력은 유지되며, 돌아오면 해당 값으로 목록을 다시 그립니다.</p><ComparisonTopicNotes topics={topics} /><a href="https://react.dev/reference/react/useDeferredValue#deferring-re-rendering-for-a-part-of-the-ui" target="_blank" rel="noreferrer" className="inline-block text-violet-600 underline">useDeferredValue 공식 문서 ↗</a></div>}
    />
  );
}
