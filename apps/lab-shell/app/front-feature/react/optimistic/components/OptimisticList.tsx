import React, { useOptimistic, useEffect, useTransition, useState, useRef } from 'react';
import type { OptimisticAction, Todo } from '../types';
import { delayWithError } from '../utils';

interface OptimisticListProps {
  items: Todo[];
  actions: readonly OptimisticAction[];
  claimAction: (actionId: number) => boolean;
  onAddComplete: (newItem: Todo) => void;
}

export function OptimisticList({ items, actions, claimAction, onAddComplete }: OptimisticListProps) {
  // [cmp:optimistic-source:start]
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dismissTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const [optimisticItems, addOptimisticItem] = useOptimistic(
    items,
    (state: Todo[], newItem: Todo) => [...state, newItem]
  );
  // [cmp:optimistic-source:end]

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // [cmp:optimistic-concurrency:start]
    // 큐 전체를 ID순으로 읽고, 같은 요청의 재실행은 부모의 처리 기록으로 막습니다.
    for (const action of actions) {
      if (!claimAction(action.id)) continue;

      // [cmp:optimistic-write-path:start]
      const newItem: Todo = {
        id: crypto.randomUUID(),
        text: `항목 #${action.id}`,
        createdAt: Date.now(),
      };

      startTransition(async () => {
        addOptimisticItem(newItem);
        setError(null);
        try {
          await delayWithError(2000, action.shouldFail);
          onAddComplete(newItem);
        } catch {
          if (!mountedRef.current) return;
          setError(`항목 #${action.id} 저장 실패 · 낙관 상태를 되돌렸습니다.`);

          // Auto-dismiss error after 1s
          if (dismissTimerRef.current) {
            clearTimeout(dismissTimerRef.current);
          }
          dismissTimerRef.current = window.setTimeout(() => setError(null), 1000);
        }
      });
      // [cmp:optimistic-write-path:end]
    }
    // [cmp:optimistic-concurrency:end]
  }, [actions, addOptimisticItem, claimAction, onAddComplete, startTransition]);

  return (
    <div className="relative min-w-0">
      {error && (
        <p role="status" className="mb-2 rounded border border-red-300 bg-red-50 p-2 text-xs text-red-600">
           ⚠️ {error}
        </p>
      )}
      <ul className="space-y-2">
        {optimisticItems.map((item) => {
          const isOptimistic = !items.find(i => i.id === item.id);

          return (
            <li
              key={item.id}
              className={`
                  p-4 rounded-lg border transition-all duration-300
                  ${isOptimistic
                      ? 'bg-violet-50 border-violet-300 text-violet-900 opacity-90'
                      : 'bg-white border-slate-200 text-slate-800'
                  }
              `}
            >
              <div className="flex justify-between items-center">
                  <span>{item.text}</span>
                  {isOptimistic && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-300">
                          저장 중
                      </span>
                  )}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">ID: {item.id.slice(0, 8)}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
