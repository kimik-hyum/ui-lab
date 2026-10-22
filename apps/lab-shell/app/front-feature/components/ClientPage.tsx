'use client';

import { ReactNode, useMemo, useState, useCallback } from 'react';
import { TraditionalList } from '../react/optimistic/components/TraditionalList';
import { OptimisticList } from '../react/optimistic/components/OptimisticList';
import { Todo } from '../react/optimistic/types';
import { ComparisonTemplate, ComparisonTopic } from './ComparisonTemplate';
import { collectAnchorLines, resolveTopicLines } from './codeAnchors';

type TopicDefinition = {
  id: string;
  title: string;
  description: ReactNode;
  leftAnchors: string[];
  rightAnchors: string[];
  fallbackLeftLines: number[];
  fallbackRightLines: number[];
};

const TOPIC_DEFINITIONS: TopicDefinition[] = [
    {
        id: 'state-mgmt',
        title: "State Ownership: Mirroring vs Single Source",
        description: (
            <div className="space-y-2">
                <p>
                    <span className="text-amber-700 font-semibold">Traditional:</span> 부모 상태(`items`)를 로컬 `useState`로 복제한 뒤
                    `useEffect` 동기화까지 직접 유지해야 합니다. 상태 소유권이 분산되어 유지보수 비용이 커집니다.
                </p>
                <p>
                    <span className="text-accent font-semibold">Optimistic:</span> `useOptimistic(state, updateFn)`으로 원본 상태를
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
                    <span className="text-amber-700 font-semibold">Traditional:</span> 새 항목 생성, 이전 상태 백업, 실패 시 롤백, 에러 UI 처리까지
                    한 흐름에 직접 작성해야 합니다.
                </p>
                <p>
                    <span className="text-accent font-semibold">Optimistic:</span> `addOptimisticItem`으로 의도를 먼저 반영하고,
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
                    <span className="text-amber-700 font-semibold">Traditional:</span> 빠른 연속 클릭 시 각 요청의 롤백 시점과 백업 상태를
                    사람이 맞춰야 해서 코드가 빠르게 복잡해집니다.
                </p>
                <p>
                    <span className="text-accent font-semibold">Optimistic:</span> 낙관 상태는 pending 동안만 유지되고 실패 시 자동 폐기됩니다.
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
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAction}
                className="min-h-9 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Add Item
              </button>
              <button
                onClick={handleBurstAction}
                className="min-h-9 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface"
              >
                Add 3 Fast
              </button>
              <button
                aria-pressed={failNext}
                onClick={() => setFailNext((prev) => !prev)}
                className={`min-h-9 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  failNext
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-white text-muted-foreground border-border hover:bg-surface'
                }`}
              >
                Fail Next: {failNext ? 'ON' : 'OFF'}
              </button>
            </div>
        }

        leftComponent={
          <div>
            {trigger.id === 0 ? <div className="mb-5 rounded-xl border border-dashed border-border bg-surface px-5 py-10 text-center"><p className="text-sm font-medium text-foreground">직접 실행해 보세요</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">상단의 Add Item으로 항목을 추가합니다.<br />대기 상태와 실패 시 복원을 비교하세요.</p></div> : null}
            <TraditionalList 
                items={itemsA} 
                actionTrigger={trigger} 
                onAddComplete={handleAddA}
            />
          </div>
        }
        rightComponent={
          <div>
            {trigger.id === 0 ? <div className="mb-5 rounded-xl border border-dashed border-accent/25 bg-accent-subtle/40 px-5 py-10 text-center"><p className="text-sm font-medium text-foreground">같은 동작, 다른 구현</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">두 패널에 같은 요청이 전달됩니다.<br />코드 비교에서 상태 관리의 차이도 살펴보세요.</p></div> : null}
            <OptimisticList 
                items={itemsB} 
                actionTrigger={trigger} 
                onAddComplete={handleAddB}
            />
          </div>
        }
    />
  );
}
