'use client';

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComparisonTopic } from "../../components/ComparisonTypes";
import { ComparisonTemplate } from "../../components/ComparisonTemplate";
import { collectAnchorLines, resolveTopicLines } from "../../components/codeAnchors";
import { ActivityHiddenDemo } from "./components/ActivityHiddenDemo";
import { TraditionalHiddenDemo, WorkerStats } from "./components/TraditionalHiddenDemo";

type TopicDefinition = {
  id: string;
  title: string;
  description: ReactNode;
  leftAnchors: string[];
  rightAnchors: string[];
  fallbackLeftLines: number[];
  fallbackRightLines: number[];
};

const INITIAL_STATS: WorkerStats = {
  renders: 0,
  effectTicks: 0,
  workUnits: 0,
};

const TOPIC_DEFINITIONS: TopicDefinition[] = [
  {
    id: "hidden-strategy",
    title: "Hidden 전략 차이",
    description: (
      <div className="space-y-2">
        <p>
          <span className="text-red-300 font-bold">Traditional:</span> <code>display: none</code>으로 숨기면 DOM만 가려지고,
          컴포넌트 자체는 마운트된 상태로 남습니다.
        </p>
        <p>
          <span className="text-blue-300 font-bold">Activity:</span> <code>&lt;Activity mode=&quot;hidden&quot; /&gt;</code> 경계 내에서
          숨김 상태를 관리해 백그라운드 업데이트 부담을 줄일 수 있습니다.
        </p>
      </div>
    ),
    leftAnchors: ["hidden-strategy"],
    rightAnchors: ["hidden-strategy"],
    fallbackLeftLines: [94, 95, 96],
    fallbackRightLines: [91, 92, 93, 94],
  },
  {
    id: "background-effects",
    title: "Background Effect 비용",
    description: (
      <div className="space-y-2">
        <p>
          두 구현 모두 interval 기반 effect를 갖고 있지만, 숨김 처리 전략에 따라 실제로 effect가 살아있는 시간이 달라집니다.
        </p>
        <p>
          숨김 상태를 길게 유지해보면 <code>effect ticks</code> 증가폭 차이로 백그라운드 작업량을 쉽게 비교할 수 있습니다.
        </p>
      </div>
    ),
    leftAnchors: ["background-effects"],
    rightAnchors: ["background-effects"],
    fallbackLeftLines: [43, 44, 45, 46, 47, 48, 49],
    fallbackRightLines: [40, 41, 42, 43, 44, 45, 46],
  },
  {
    id: "work-tracking",
    title: "렌더/작업량 지표",
    description: (
      <div className="space-y-2">
        <p>
          <code>renders</code>는 다시 렌더된 횟수, <code>work units</code>는 렌더마다 수행한 계산량(데모용)을 누적한 값입니다.
        </p>
        <p>
          숨김 상태에서 좌측 값이 빠르게 증가하면, 화면에 안 보여도 계산이 계속 일어나고 있음을 의미합니다.
        </p>
      </div>
    ),
    leftAnchors: ["work-tracking"],
    rightAnchors: ["work-tracking"],
    fallbackLeftLines: [35, 36, 37, 38, 39],
    fallbackRightLines: [32, 33, 34, 35, 36],
  },
];

export function ActivityClientPage({
  traditionalCode,
  activityCode,
}: {
  traditionalCode: string;
  activityCode: string;
}) {
  const [hidden, setHidden] = useState(false);
  const [sessionId, setSessionId] = useState(0);
  const [tick, setTick] = useState(0);
  const [traditionalStats, setTraditionalStats] = useState<WorkerStats>(INITIAL_STATS);
  const [activityStats, setActivityStats] = useState<WorkerStats>(INITIAL_STATS);

  const traditionalStatsRef = useRef<WorkerStats>({ ...INITIAL_STATS });
  const activityStatsRef = useRef<WorkerStats>({ ...INITIAL_STATS });

  const topics = useMemo<ComparisonTopic[]>(() => {
    const leftAnchorLines = collectAnchorLines(traditionalCode);
    const rightAnchorLines = collectAnchorLines(activityCode);

    return TOPIC_DEFINITIONS.map((topic) => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      leftLines: resolveTopicLines(topic.leftAnchors, leftAnchorLines, topic.fallbackLeftLines),
      rightLines: resolveTopicLines(topic.rightAnchors, rightAnchorLines, topic.fallbackRightLines),
    }));
  }, [traditionalCode, activityCode]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((prev) => prev + 1);
    }, 120);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTraditionalStats({ ...traditionalStatsRef.current });
      setActivityStats({ ...activityStatsRef.current });
    }, 240);

    return () => window.clearInterval(id);
  }, []);

  const resetStats = useCallback(() => {
    traditionalStatsRef.current = { ...INITIAL_STATS };
    activityStatsRef.current = { ...INITIAL_STATS };
    setTraditionalStats({ ...INITIAL_STATS });
    setActivityStats({ ...INITIAL_STATS });
    setTick(0);
    setSessionId((prev) => prev + 1);
  }, []);

  return (
    <ComparisonTemplate
      title="Activity vs display:none 비교"
      description="숨김 상태에서 백그라운드 렌더/이펙트 비용이 어떻게 달라지는지 코드와 지표를 함께 확인합니다."
      leftTitle="Traditional Hidden (display:none)"
      rightTitle="Activity Hidden (mode=hidden)"
      leftCode={traditionalCode}
      rightCode={activityCode}
      topics={topics}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHidden((prev) => !prev)}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {hidden ? "패널 표시" : "패널 숨기기"}
          </button>
          <button
            onClick={resetStats}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
          >
            지표 초기화
          </button>
        </div>
      }
      leftComponent={
        <TraditionalHiddenDemo
          key={`traditional-${sessionId}`}
          hidden={hidden}
          tick={tick}
          stats={traditionalStats}
          statsRef={traditionalStatsRef}
        />
      }
      rightComponent={
        <ActivityHiddenDemo
          key={`activity-${sessionId}`}
          hidden={hidden}
          tick={tick}
          stats={activityStats}
          statsRef={activityStatsRef}
        />
      }
    />
  );
}
