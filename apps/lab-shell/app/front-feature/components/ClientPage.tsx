'use client';

import { ReactNode, useMemo, useState, useCallback, useRef } from 'react';
import { TraditionalList } from '../react/optimistic/components/TraditionalList';
import { OptimisticList } from '../react/optimistic/components/OptimisticList';
import type { OptimisticAction, Todo } from '../react/optimistic/types';
import { ComparisonTemplate, ComparisonTopic } from './ComparisonTemplate';
import { collectAnchorLines, resolveTopicLines } from './codeAnchors';
import { REACT_IMPLEMENTATION_LABELS } from '../react/comparison-labels';

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
        title: "수동 상태 복제와 낙관 상태 계산",
        description: (
            <div className="space-y-2">
                <p>
                    <span className="text-red-300 font-bold">수동 상태 관리 + 롤백:</span> 부모 상태(`items`)를 로컬 `useState`로 복제한 뒤
                    props 변경 감지와 수동 동기화까지 직접 유지해야 합니다. 상태 소유권이 분산되어 유지보수 비용이 커집니다.
                </p>
                <p>
                    <span className="text-blue-300 font-bold">useOptimistic + 자동 복원:</span> `useOptimistic(state, updateFn)`으로 원본 상태를
                    기준으로 낙관 상태를 계산합니다. React 공식 문서처럼 `updateFn`만 순수하게 유지하면 됩니다.
                </p>
            </div>
        ),
        leftAnchors: ['state-mirroring'],
        rightAnchors: ['optimistic-source'],
        fallbackLeftLines: [14, 15, 21, 22, 23],
        fallbackRightLines: [13, 17, 18, 19, 20],
    },
    {
        id: 'write-path',
        title: "직접 롤백과 자동 복원",
        description: (
            <div className="space-y-2">
                <p>
                    <span className="text-red-300 font-bold">수동 상태 관리 + 롤백:</span> 새 항목 생성, 이전 상태 백업, 실패 시 롤백, 에러 UI 처리까지
                    한 흐름에 직접 작성해야 합니다.
                </p>
                <p>
                    <span className="text-blue-300 font-bold">useOptimistic + 자동 복원:</span> `startTransition` 안에서 `addOptimisticItem`으로 의도를 먼저 반영하고,
                    성공 시 확정 상태만 커밋합니다. 실패 시 낙관 상태는 자동으로 사라집니다.
                </p>
            </div>
        ),
        leftAnchors: ['manual-write-path'],
        rightAnchors: ['optimistic-write-path'],
        fallbackLeftLines: [42, 48, 50, 51, 52, 56, 57, 61, 62],
        fallbackRightLines: [35, 41, 42, 45, 46, 49],
    },
    {
        id: 'concurrency',
        title: "연속 요청과 중복 실행 방지",
        description: (
            <div className="space-y-2">
                <p>
                    <span className="text-red-300 font-bold">수동 상태 관리 + 롤백:</span> 빠른 연속 클릭 시 각 요청의 롤백 시점과 백업 상태를
                    사람이 맞춰야 해서 코드가 빠르게 복잡해집니다.
                </p>
                <p>
                    <span className="text-blue-300 font-bold">useOptimistic + 자동 복원:</span> 낙관 상태는 pending 동안만 유지되고 실패 시 자동 폐기됩니다.
                    ‘다음 요청 실패’를 켜고 ‘3개 연속 추가’로 확인할 수 있습니다.
                </p>
                <p>
                    양쪽 모두 부모에 요청 목록과 처리한 ID를 보관하여 각 요청을 한 번씩 실행하고,
                    화면을 전환해도 진행 중인 요청의 성공 결과를 보존합니다. 이 요청 관리는 useOptimistic이 대신하지 않습니다.
                </p>
            </div>
        ),
        leftAnchors: ['manual-trigger-guard', 'manual-rollback-point'],
        rightAnchors: ['optimistic-concurrency'],
        fallbackLeftLines: [36, 37, 62],
        fallbackRightLines: [31, 32, 33, 41, 42],
    }
];

export function ClientPage({ traditionalCode, optimisticCode }: { traditionalCode: string, optimisticCode: string }) {
  const [itemsA, setItemsA] = useState<Todo[]>([]);
  const [itemsB, setItemsB] = useState<Todo[]>([]);
  const [actions, setActions] = useState<OptimisticAction[]>([]);
  const [failNext, setFailNext] = useState(false);
  // 비교 화면이 코드로 전환되어 자식이 사라져도 요청 처리 기록은 유지합니다.
  const processedActions = useRef({ manual: 0, optimistic: 0 });
  const claimManualAction = useCallback((actionId: number) => {
    if (actionId <= processedActions.current.manual) return false;
    processedActions.current.manual = actionId;
    return true;
  }, []);
  const claimOptimisticAction = useCallback((actionId: number) => {
    if (actionId <= processedActions.current.optimistic) return false;
    processedActions.current.optimistic = actionId;
    return true;
  }, []);

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

  const enqueueActions = useCallback((count: number, failFirst: boolean) => {
    setActions((previous) => {
      const firstId = (previous.at(-1)?.id ?? 0) + 1;
      return [...previous, ...Array.from({ length: count }, (_, index) => ({
        id: firstId + index,
        shouldFail: failFirst && index === 0,
      }))];
    });
  }, []);

  const handleAction = useCallback(() => {
    enqueueActions(1, failNext);
    if (failNext) {
      setFailNext(false);
    }
  }, [enqueueActions, failNext]);

  const handleBurstAction = useCallback(() => {
    enqueueActions(3, failNext);
    if (failNext) {
      setFailNext(false);
    }
  }, [enqueueActions, failNext]);

  const handleAddA = useCallback((item: Todo) => setItemsA((prev) => [...prev, item]), []);
  const handleAddB = useCallback((item: Todo) => setItemsB((prev) => [...prev, item]), []);

  return (
    <ComparisonTemplate
        implementationLabels={REACT_IMPLEMENTATION_LABELS}
        title="낙관적 업데이트 · 실패하면 어떻게 되돌릴까요?"
        description="useState로 항목 추가·상태 동기화·실패 복구를 직접 작성한 구현과 useOptimistic에 낙관 상태를 맡긴 구현을 비교합니다. 2초는 관찰용 지연이며 실제 서버 저장이나 속도 측정이 아닙니다."
        leftTitle="useState · 상태 관리와 롤백"
        rightTitle="useOptimistic + 자동 복원"
        leftCode={traditionalCode}
        rightCode={optimisticCode}
        topics={comparisonTopics}

        headerActions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAction}
                className="min-h-11 rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                1개 추가
              </button>
              <button
                type="button"
                onClick={handleBurstAction}
                className="min-h-11 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                3개 연속 추가
              </button>
              <button
                type="button"
                onClick={() => setFailNext((prev) => !prev)}
                aria-pressed={failNext}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium ${
                  failNext
                    ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                다음 요청 실패: {failNext ? '켜짐' : '꺼짐'}
              </button>
            </div>
        }

        leftComponent={
            <TraditionalList 
                items={itemsA} 
                actions={actions}
                claimAction={claimManualAction}
                onAddComplete={handleAddA}
            />
        }
        rightComponent={
            <OptimisticList 
                items={itemsB} 
                actions={actions}
                claimAction={claimOptimisticAction}
                onAddComplete={handleAddB}
            />
        }
        footer={
          <div className="space-y-4 p-6 text-sm leading-relaxed text-slate-500">
            <p>‘다음 요청 실패’를 켜고 ‘3개 연속 추가’를 눌러 첫 항목의 롤백과 나머지 두 항목의 확정을 확인하세요.</p>
            <p>이미 시작한 요청의 성공 결과는 실행·코드 화면을 오가도 유지됩니다.</p>
          </div>
        }
    />
  );
}
