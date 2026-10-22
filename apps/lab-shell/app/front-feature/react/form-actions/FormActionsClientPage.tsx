'use client';

import { useMemo, useState } from "react";
import { ComparisonTemplate } from "../../components/ComparisonTemplate";
import { ComparisonTopicNotes } from "../../components/ComparisonTopicNotes";
import { collectAnchorLines, resolveTopicLines } from "../../components/codeAnchors";
import type { ComparisonTopic } from "../../components/ComparisonTypes";
import { ActionProfileForm } from "./components/ActionProfileForm";
import { ManualProfileForm } from "./components/ManualProfileForm";

const TOPICS = [
  { id: "form-state", title: "결과와 진행 상태를 한 흐름으로", description: "수동 구현은 결과·pending을 각각 갱신합니다. useActionState는 Action의 반환값과 진행 여부를 연결해 상태 전환 누락을 줄입니다.", left: [11, 12, 13], right: [10] },
  { id: "form-submit", title: "제출 이벤트 대신 Action 연결", description: "왼쪽은 preventDefault와 FormData 수집을 직접 처리합니다. 오른쪽은 form action으로 전달해 React의 Transition 안에서 실행하므로 제출 연결 코드가 간단해집니다.", left: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 27, 28, 29, 30, 31], right: [16, 17, 18, 19] },
  { id: "form-pending", title: "가장 가까운 폼의 대기 상태", description: "왼쪽 버튼은 부모가 만든 pending 값을 받습니다. useFormStatus는 자식에서 소속 폼의 상태를 읽어 공통 제출 버튼의 props 전달을 줄입니다. 같은 컴포넌트가 만든 폼의 상태는 읽지 못합니다.", left: [41], right: [33, 34, 41] },
  { id: "form-reset", title: "초기화와 입력 복원 정책", description: "왼쪽은 성공 후 직접 reset하고, 오른쪽은 React의 자동 초기화와 defaultValue를 연결합니다. 공통 함수는 오류일 때 공백까지 원문을 돌려줘 재입력을 줄이고, 성공일 때 앞뒤 공백을 뺀 이름을 저장하고 입력을 비웁니다.", left: [25, 26, 70, 71, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88], right: [39, 40, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86] },
];

export function FormActionsClientPage({ manualCode, actionCode }: { manualCode: string; actionCode: string }) {
  const [shouldFail, setShouldFail] = useState(false);
  const [session, setSession] = useState(0);
  const topics = useMemo<ComparisonTopic[]>(() => {
    const left = collectAnchorLines(manualCode);
    const right = collectAnchorLines(actionCode);
    return TOPICS.map((topic) => ({
      id: topic.id, title: topic.title, description: <p>{topic.description}</p>,
      leftLines: resolveTopicLines([topic.id], left, topic.left),
      rightLines: resolveTopicLines([topic.id], right, topic.right),
    }));
  }, [manualCode, actionCode]);

  return (
    <ComparisonTemplate
      title="Form Actions · 제출 상태를 누가 관리할까요?"
      description="같은 이름 저장 폼으로 성공·오류·재시도를 비교합니다. 800ms는 상태 관찰용 지연이며 실제 서버 저장이나 속도 측정이 아닙니다."
      leftTitle="onSubmit + 직접 상태 관리" rightTitle="useActionState + useFormStatus"
      leftCode={manualCode} rightCode={actionCode} topics={topics}
      headerActions={<div className="flex flex-wrap items-center gap-3 text-xs text-slate-600"><label className="flex items-center gap-2"><input type="checkbox" checked={shouldFail} onChange={(event) => setShouldFail(event.target.checked)} className="accent-violet-600" />저장 실패 모드</label><button className="rounded-full border border-slate-300 px-3 py-2" onClick={() => { setShouldFail(false); setSession((value) => value + 1); }}>두 폼 초기화</button></div>}
      leftComponent={<ManualProfileForm key={`manual-${session}`} shouldFail={shouldFail} />}
      rightComponent={<ActionProfileForm key={`action-${session}`} shouldFail={shouldFail} />}
      footer={<div className="space-y-3 p-6 text-sm leading-relaxed text-slate-500"><p>① 양쪽에 이름을 입력하고 저장 ② 한 글자 또는 실패 모드로 오류 확인 ③ 옵션을 끄고 재시도. 대기 중 중복 제출, 성공 후 빈 입력, 오류 후 입력 보존을 관찰하세요. 코드 화면을 오가거나 페이지를 벗어나면 폼이 제거되어 입력과 기록이 초기화됩니다.</p><p>두 폼은 동일한 로컬 함수 saveProfile을 사용합니다. 이 예제의 Action은 클라이언트 함수이며 Server Action이 아닙니다.</p><ComparisonTopicNotes topics={topics} /><div className="flex flex-wrap gap-4"><a href="https://react.dev/reference/react/useActionState" target="_blank" rel="noreferrer" className="text-violet-600 underline">useActionState 공식 문서 ↗</a><a href="https://react.dev/reference/react-dom/hooks/useFormStatus" target="_blank" rel="noreferrer" className="text-violet-600 underline">useFormStatus 공식 문서 ↗</a><a href="https://react.dev/reference/react-dom/components/form" target="_blank" rel="noreferrer" className="text-violet-600 underline">form 자동 초기화 ↗</a></div></div>}
    />
  );
}
