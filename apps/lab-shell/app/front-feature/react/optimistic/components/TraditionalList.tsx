import React, { useState, useEffect, useRef } from 'react';
import type { OptimisticAction, Todo } from '../types';
import { delayWithError } from '../utils';

interface TraditionalListProps {
  items: Todo[];
  actions: readonly OptimisticAction[];
  claimAction: (actionId: number) => boolean;
  onAddComplete: (newItem: Todo) => void;
}

export function TraditionalList({ items, actions, claimAction, onAddComplete }: TraditionalListProps) {
  // [cmp:state-mirroring:start]
  // Manual State Mirroring
  const [localItems, setLocalItems] = useState(items);
  const [previousItems, setPreviousItems] = useState(items);
  const [error, setError] = useState<string | null>(null);
  const dismissTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  // 비교 데모의 수동 복제는 유지하되, props 변경을 다음 Effect까지 미루지 않습니다.
  if (items !== previousItems) {
    setPreviousItems(items);
    setLocalItems(items);
  }
  // [cmp:state-mirroring:end]

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  useEffect(() => {
    for (const action of actions) {
      // [cmp:manual-trigger-guard:start]
      // 부모의 큐를 ID순으로 읽고, 이미 시작한 요청은 재마운트 후에도 건너뜁니다.
      if (!claimAction(action.id)) continue;
      // [cmp:manual-trigger-guard:end]

      const addItemWithManualRollback = async () => {
        setError(null);

        // [cmp:manual-write-path:start]
        const newItem: Todo = {
          id: crypto.randomUUID(),
          text: `항목 #${action.id}`,
          createdAt: Date.now(),
        };

        let previousItems: Todo[] = [];

        setLocalItems((prev) => {
          previousItems = prev;
          return [...prev, newItem];
        });

        try {
          await delayWithError(2000, action.shouldFail);
          onAddComplete(newItem);

        } catch {
          if (!mountedRef.current) return;
          setError(`항목 #${action.id} 저장 실패 · 이전 상태로 복원했습니다.`);
          // [cmp:manual-rollback-point:start]
          setLocalItems(previousItems);
          // [cmp:manual-rollback-point:end]

          // Auto-dismiss error after 1s
          if (dismissTimerRef.current) {
            clearTimeout(dismissTimerRef.current);
          }
          dismissTimerRef.current = window.setTimeout(() => setError(null), 1000);
        }
        // [cmp:manual-write-path:end]
      };

      void addItemWithManualRollback();
    }
  }, [actions, claimAction, onAddComplete]);

  return (
    <div className="relative min-w-0">
      {error && (
        <p role="status" className="mb-2 rounded border border-red-300 bg-red-50 p-2 text-xs text-red-600">
           ⚠️ {error}
        </p>
      )}
      <ul className="space-y-2">
        {localItems.map((item) => {
           const isConfirmed = items.find(i => i.id === item.id);

           return (
            <li
              key={item.id}
              className={`
                  p-4 rounded-lg border transition-all duration-300
                  ${!isConfirmed
                      ? 'bg-violet-50 border-violet-300 text-violet-900 opacity-90'
                      : 'bg-white border-slate-200 text-slate-800'
                  }
              `}
            >
              <div className="flex justify-between items-center">
                  <span>{item.text}</span>
                  {!isConfirmed && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-300">
                          저장 중
                      </span>
                  )}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">ID: {item.id.slice(0, 8)}</div>
            </li>
          )
        })}
      </ul>
    </div>
  );
}
