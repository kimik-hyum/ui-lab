'use client';

import { useMemo, useState } from "react";
import type { ComparisonTopic } from "../../components/ComparisonTypes";
import { ComparisonTemplate } from "../../components/ComparisonTemplate";
import { collectAnchorLines, resolveTopicLines } from "../../components/codeAnchors";
import { ActivityHiddenDemo } from "./components/ActivityHiddenDemo";
import { TraditionalHiddenDemo } from "./components/TraditionalHiddenDemo";

const TOPICS = [
  {
    id: "hidden-strategy",
    title: "화면을 가리는 방법과 Effect의 수명",
    description: "CSS는 화면만 가리고 Effect를 유지합니다. Activity는 화면을 숨길 때 Effect도 정리합니다. 숨겨진 탭의 구독이나 타이머를 멈출 때 별도 조건 처리를 줄일 수 있습니다.",
    left: [14, 15, 16], right: [14, 15, 16],
  },
  {
    id: "background-effects",
    title: "같은 정리 함수, 다른 실행 시점",
    description: "양쪽 모두 같은 interval과 clearInterval을 사용합니다. 숨기면 CSS 쪽 호출은 계속 늘고 Activity 쪽은 멈춥니다. 다시 표시하면 Activity의 Effect가 새로 시작하므로 구독과 정리는 반복 실행해도 안전해야 합니다.",
    left: [35, 36, 37, 38, 39, 40, 41, 42], right: [35, 36, 37, 38, 39, 40, 41, 42],
  },
  {
    id: "state-preservation",
    title: "Effect를 정리해도 입력 상태는 보존",
    description: "두 방식 모두 숨기기 전에 적은 메모를 유지합니다. Activity는 컴포넌트를 제거하는 조건부 렌더링과 달리 내부 상태를 보존하면서 Effect를 정리합니다. 화면을 다시 열 때 입력 복원 코드를 따로 만들지 않아도 됩니다.",
    left: [33, 46, 47, 48, 49, 50, 51, 52, 53, 54], right: [33, 46, 47, 48, 49, 50, 51, 52, 53, 54],
  },
];

export function ActivityClientPage({ traditionalCode, activityCode }: {
  traditionalCode: string;
  activityCode: string;
}) {
  const [hidden, setHidden] = useState(false);
  const [session, setSession] = useState(0);
  const topics = useMemo<ComparisonTopic[]>(() => {
    const left = collectAnchorLines(traditionalCode);
    const right = collectAnchorLines(activityCode);
    return TOPICS.map((topic) => ({
      id: topic.id, title: topic.title, description: <p>{topic.description}</p>,
      leftLines: resolveTopicLines([topic.id], left, topic.left),
      rightLines: resolveTopicLines([topic.id], right, topic.right),
    }));
  }, [traditionalCode, activityCode]);

  return (
    <ComparisonTemplate
      title="Activity · 숨김과 Effect 정리"
      description="양쪽에 메모를 적고 패널을 숨겼다가 다시 표시하세요. 입력 보존과 interval의 정리·재시작을 함께 확인합니다."
      leftTitle="CSS · 화면만 숨기기"
      rightTitle="Activity · Effect도 정리하기"
      leftCode={traditionalCode}
      rightCode={activityCode}
      topics={topics}
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={hidden}
            onClick={() => setHidden((value) => !value)}
            className="min-h-11 rounded-full border border-slate-300 bg-white px-4 text-xs text-slate-700 hover:bg-slate-50"
          >
            {hidden ? "패널 표시" : "패널 숨기기"}
          </button>
          <button
            type="button"
            onClick={() => { setHidden(false); setSession((value) => value + 1); }}
            className="min-h-11 rounded-full border border-slate-300 px-4 text-xs text-slate-600 hover:bg-slate-50"
          >
            양쪽 처음부터
          </button>
        </div>
      }
      leftComponent={<TraditionalHiddenDemo key={`css-${session}`} hidden={hidden} />}
      rightComponent={<ActivityHiddenDemo key={`activity-${session}`} hidden={hidden} />}
      footer={
        <div className="space-y-4 p-6 text-sm leading-relaxed text-slate-600">
          <p><strong className="text-slate-800">관찰 순서</strong> · 메모 입력 → 패널 숨기기 → interval 횟수 비교 → 다시 표시해 메모와 Effect 시작 횟수 확인.</p>
          <p>카운터는 실제 Effect·interval 호출 횟수입니다. 숨긴 Activity도 새 props에 반응해 렌더링할 수 있으므로 렌더 횟수나 성능으로 읽지 않습니다.</p>
          <p>코드 화면으로 전환하면 두 데모가 정리되고, UI로 돌아오면 새로 시작합니다. 개발 모드의 Strict Mode도 Effect를 다시 실행하므로 조작 전후의 변화에 주목하세요.</p>
          <a href="https://react.dev/reference/react/Activity" target="_blank" rel="noreferrer" className="inline-block text-violet-600 underline underline-offset-4">Activity 공식 문서 ↗</a>
        </div>
      }
    />
  );
}
