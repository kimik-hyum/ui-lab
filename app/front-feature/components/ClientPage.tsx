'use client';

import { ReactNode, useMemo, useState, useCallback } from 'react';
import { TraditionalList } from '../react/optimistic/components/TraditionalList';
import { OptimisticList } from '../react/optimistic/components/OptimisticList';
import { Todo } from '../react/optimistic/types';
import { ComparisonTemplate, ComparisonTopic } from './ComparisonTemplate';

type TopicDefinition = {
  id: string;
  title: string;
  description: ReactNode;
  leftAnchors: string[];
  rightAnchors: string[];
  fallbackLeftLines: number[];
  fallbackRightLines: number[];
};

const ANCHOR_MARKER_PATTERN = /^\s*\/\/\s*\[cmp:([a-z0-9-]+):(start|end)\]\s*$/i;

const TOPIC_DEFINITIONS: TopicDefinition[] = [
    {
        id: 'state-mgmt',
        title: "State Ownership: Mirroring vs Single Source",
        description: (
            <div className="space-y-2">
                <p>
                    <span className="text-red-300 font-bold">Traditional:</span> 부모 상태(`items`)를 로컬 `useState`로 복제한 뒤
                    `useEffect` 동기화까지 직접 유지해야 합니다. 상태 소유권이 분산되어 유지보수 비용이 커집니다.
                </p>
                <p>
                    <span className="text-blue-300 font-bold">Optimistic:</span> `useOptimistic(state, updateFn)`으로 원본 상태를
                    기준으로 낙관 상태를 계산합니다. React 공식 문서처럼 `updateFn`만 순수하게 유지하면 됩니다.
                </p>
            </div>
        ),
        leftAnchors: ['state-mirroring'],
        rightAnchors: ['optimistic-source'],
        fallbackLeftLines: [13, 18, 19],
        fallbackRightLines: [16, 17, 18, 19],
    },
    {
        id: 'write-path',
        title: "Write Path: Manual Rollback vs Intent Dispatch",
        description: (
            <div className="space-y-2">
                <p>
                    <span className="text-red-300 font-bold">Traditional:</span> 새 항목 생성, 이전 상태 백업, 실패 시 롤백, 에러 UI 처리까지
                    한 흐름에 직접 작성해야 합니다.
                </p>
                <p>
                    <span className="text-blue-300 font-bold">Optimistic:</span> `addOptimisticItem`으로 의도를 먼저 반영하고,
                    성공 시 확정 상태만 커밋합니다. 실패 시 낙관 상태는 자동으로 사라집니다.
                </p>
            </div>
        ),
        leftAnchors: ['manual-write-path'],
        rightAnchors: ['optimistic-write-path'],
        fallbackLeftLines: [29, 35, 37, 39, 43, 44, 48, 49],
        fallbackRightLines: [24, 31, 33, 35, 36, 39],
    },
    {
        id: 'concurrency',
        title: "Concurrent Clicks: Local Complexity vs Predictable Flow",
        description: (
            <div className="space-y-2">
                <p>
                    <span className="text-red-300 font-bold">Traditional:</span> 빠른 연속 클릭 시 각 요청의 롤백 시점과 백업 상태를
                    사람이 맞춰야 해서 코드가 빠르게 복잡해집니다.
                </p>
                <p>
                    <span className="text-blue-300 font-bold">Optimistic:</span> 낙관 상태는 pending 동안만 유지되고 실패 시 자동 폐기됩니다.
                    `Fail Next`와 `Add 3 Fast`로 직접 재현해보면 차이가 더 분명합니다.
                </p>
            </div>
        ),
        leftAnchors: ['manual-trigger-guard', 'manual-rollback-point'],
        rightAnchors: ['optimistic-concurrency'],
        fallbackLeftLines: [23, 24, 35, 49],
        fallbackRightLines: [30, 32, 33],
    }
];

const collectAnchorLines = (code: string): Record<string, number[]> => {
  const lines = code.split('\n');
  const rangeMap = new Map<string, { start?: number; end?: number }>();

  lines.forEach((line, index) => {
    const markerMatch = line.match(ANCHOR_MARKER_PATTERN);
    if (!markerMatch) return;

    const markerKey = markerMatch[1];
    const markerType = markerMatch[2];
    const lineNumber = index + 1;
    const current = rangeMap.get(markerKey) ?? {};

    if (markerType === 'start') {
      current.start = lineNumber;
    } else {
      current.end = lineNumber;
    }

    rangeMap.set(markerKey, current);
  });

  const result: Record<string, number[]> = {};
  rangeMap.forEach((range, key) => {
    if (!range.start || !range.end || range.end <= range.start + 1) return;
    const start = range.start + 1;
    const end = range.end - 1;
    result[key] = Array.from({ length: end - start + 1 }, (_, idx) => start + idx).filter(
      (lineNumber) => !ANCHOR_MARKER_PATTERN.test(lines[lineNumber - 1]),
    );
  });

  return result;
};

const resolveTopicLines = (
  anchors: string[],
  anchorLines: Record<string, number[]>,
  fallback: number[],
) => {
  const resolved = anchors.flatMap((anchor) => anchorLines[anchor] ?? []);
  const uniqueSorted = Array.from(new Set(resolved)).sort((a, b) => a - b);

  return uniqueSorted.length > 0 ? uniqueSorted : fallback;
};

export function ClientPage({ traditionalCode, optimisticCode }: { traditionalCode: string, optimisticCode: string }) {
  const [itemsA, setItemsA] = useState<Todo[]>([]);
  const [itemsB, setItemsB] = useState<Todo[]>([]);
  const [trigger, setTrigger] = useState<{ id: number; shouldFail: boolean }>({ id: 0, shouldFail: false });
  const [failNext, setFailNext] = useState(false);

  const comparisonTopics = useMemo<ComparisonTopic[]>(() => {
    const leftAnchorLines = collectAnchorLines(traditionalCode);
    const rightAnchorLines = collectAnchorLines(optimisticCode);

    return TOPIC_DEFINITIONS.map((topic) => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      leftLines: resolveTopicLines(topic.leftAnchors, leftAnchorLines, topic.fallbackLeftLines),
      rightLines: resolveTopicLines(topic.rightAnchors, rightAnchorLines, topic.fallbackRightLines),
    }));
  }, [traditionalCode, optimisticCode]);

  const emitAction = useCallback((shouldFail: boolean) => {
    setTrigger((prev) => ({ id: prev.id + 1, shouldFail }));
  }, []);

  const handleAction = useCallback(() => {
    emitAction(failNext);
    if (failNext) {
      setFailNext(false);
    }
  }, [emitAction, failNext]);

  const handleBurstAction = useCallback(() => {
    const failFirst = failNext;
    if (failNext) {
      setFailNext(false);
    }

    for (let i = 0; i < 3; i += 1) {
      const shouldFail = failFirst && i === 0;
      setTimeout(() => emitAction(shouldFail), i * 120);
    }
  }, [emitAction, failNext]);

  const handleAddA = useCallback((item: Todo) => setItemsA((prev) => [...prev, item]), []);
  const handleAddB = useCallback((item: Todo) => setItemsB((prev) => [...prev, item]), []);

  return (
    <ComparisonTemplate
        title="Optimistic UI: 생산성 비교"
        description="동일한 Add Item 경험을 만들 때, 수동 롤백 코드와 useOptimistic 기반 코드의 복잡도를 비교합니다."
        leftTitle="Manual Optimistic (Rollback 직접 구현)"
        rightTitle="useOptimistic (Pending 상태 자동 관리)"
        
        leftCode={traditionalCode}
        rightCode={optimisticCode}
        topics={comparisonTopics}

        headerActions={
            <div className="flex items-center gap-2">
              <button
                onClick={handleAction}
                className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                Add Item
              </button>
              <button
                onClick={handleBurstAction}
                className="bg-zinc-800 text-zinc-100 px-4 py-2 rounded-full text-sm font-medium border border-zinc-700 hover:bg-zinc-700 transition-colors"
              >
                Add 3 Fast
              </button>
              <button
                onClick={() => setFailNext((prev) => !prev)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  failNext
                    ? 'bg-red-500/20 text-red-200 border-red-500/40 hover:bg-red-500/30'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
                }`}
              >
                Fail Next: {failNext ? 'ON' : 'OFF'}
              </button>
            </div>
        }

        leftComponent={
            <TraditionalList 
                items={itemsA} 
                actionTrigger={trigger} 
                onAddComplete={handleAddA}
            />
        }
        rightComponent={
            <OptimisticList 
                items={itemsB} 
                actionTrigger={trigger} 
                onAddComplete={handleAddB}
            />
        }
    />
  );
}
