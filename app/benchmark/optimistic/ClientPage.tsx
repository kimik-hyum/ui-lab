'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { TraditionalList } from './components/TraditionalList';
import { OptimisticList } from './components/OptimisticList';
import { Todo } from './types';
import { ComparisonTemplate, ComparisonTopic } from '../components/ComparisonTemplate';

// ----------------------------------------------------------------------
// 1. Comparison Topics (The "Story")
// ----------------------------------------------------------------------

const COMPARISON_TOPICS: ComparisonTopic[] = [
    {
        id: 'state-mgmt',
        title: "State Management: Mirroring vs Source of Truth",
        description: (
            <div className="space-y-2">
                <p>
                    <span className="text-red-300 font-bold">Traditional:</span> Props(`items`)를 받아 `useState`로 복제하고, 
                    다시 `useEffect`로 동기화해야 합니다. 데이터의 진실(Source of Truth)이 두 곳으로 갈라져 버그의 온상이 됩니다.
                </p>
                <p>
                    <span className="text-blue-300 font-bold">Optimistic:</span> `useOptimistic` 훅이 원본 데이터(`items`)를 그대로 사용하며, 
                    React가 별도의 동기화 없이 변경 사항만 "임시 레이어"로 덮어씌웁니다. 훨씬 선언적입니다.
                </p>
            </div>
        ),
        leftLines: [14, 17, 18, 19], // useState + useEffect
        rightLines: [16, 17, 18, 19] // useOptimistic
    },
    {
        id: 'update-logic',
        title: "Update Logic: Boilerplate vs One-Liner",
        description: (
            <div className="space-y-2">
                <p>
                    <span className="text-red-300 font-bold">Traditional:</span> 에러 발생 시 되돌리기 위해 `previousItems`를 백업해두고, 
                    UI를 먼저 업데이트하는 코드를 수동으로 작성해야 합니다.
                </p>
                <p>
                    <span className="text-blue-300 font-bold">Optimistic:</span> `addOptimisticItem` 함수 호출 한 번으로 끝납니다. 
                    UI 업데이트와 데이터 관리를 React가 알아서 처리합니다.
                </p>
            </div>
        ),
        leftLines: [33, 35], // Backup + SetState
        rightLines: [33]     // addOptimisticItem
    },
    {
        id: 'error-handling',
        title: "Error Handling: Manual Rollback vs Auto Revert",
        description: (
            <div className="space-y-2">
                <p>
                    <span className="text-red-300 font-bold">Traditional:</span> `catch` 블록에서 백업해둔 데이터(`previousItems`)로 
                    되돌리는 코드를 <span className="underline decoration-wavy decoration-red-500">직접</span> 작성해야 합니다. 실수하면 영구적인 데이터 불일치가 발생합니다.
                </p>
                <p>
                    <span className="text-blue-300 font-bold">Optimistic:</span> 롤백 코드가 <u>전혀 없습니다</u>. 
                    async 작업이 실패하면 React가 자동으로 Optimistic State를 버리고 원본 상태로 복구합니다.
                </p>
            </div>
        ),
        leftLines: [42, 44, 45], // catch block manual revert
        rightLines: [37, 38]     // catch block (logging only)
    }
];

export function ClientPage({ traditionalCode, optimisticCode }: PageProps) {
  // Calculate all interactive lines for indicators
  const allLeftLines = useMemo(() => COMPARISON_TOPICS.flatMap(t => t.leftLines), []);
  const allRightLines = useMemo(() => COMPARISON_TOPICS.flatMap(t => t.rightLines), []);

  const [itemsA, setItemsA] = useState<Todo[]>([]);
  const [itemsB, setItemsB] = useState<Todo[]>([]);
  const [trigger, setTrigger] = useState<{id: number, shouldFail: boolean}>({ id: 0, shouldFail: false });
  const [metrics, setMetrics] = useState<{ a: number | null; b: number | null }>({ a: null, b: null });
  
  const handleAction = useCallback(() => {
    // Increment ID to trigger new add
    // Random 50% failure rate
    const nextId = trigger.id + 1;
    const shouldFail = Math.random() > 0.5;
    
    // Reset metrics
    setMetrics({ a: null, b: null });
    
    // Trigger both
    setTrigger({ id: nextId, shouldFail });
  }, [trigger.id]);

  const handleAddA = useCallback((item: Todo) => setItemsA((prev) => [...prev, item]), []);
  const handleAddB = useCallback((item: Todo) => setItemsB((prev) => [...prev, item]), []);
  const handleRenderA = useCallback((duration: number) => setMetrics((prev) => ({ ...prev, a: duration })), []);
  const handleRenderB = useCallback((duration: number) => setMetrics((prev) => ({ ...prev, b: duration })), []);

  return (
    <ComparisonTemplate
        title="Optimistic UI Benchmark"
        description="Manual vs. useOptimistic()"
        leftTitle="Blocking UI (Manual)"
        rightTitle="Optimistic UI (Auto)"
        
        leftCode={traditionalCode}
        rightCode={optimisticCode}
        topics={COMPARISON_TOPICS}
        
        metrics={{
            leftLatency: metrics.a,
            rightLatency: metrics.b
        }}
        
        headerActions={
            <button
                onClick={handleAction}
                className="bg-white text-black px-6 py-2 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
                Add Item
            </button>
        }

        leftComponent={
            <TraditionalList 
                items={itemsA} 
                actionTrigger={trigger} 
                onAddComplete={handleAddA}
                onRenderComplete={handleRenderA}
            />
        }
        rightComponent={
            <OptimisticList 
                items={itemsB} 
                actionTrigger={trigger} 
                onAddComplete={handleAddB}
                onRenderComplete={handleRenderB}
            />
        }
    />
  );
}
