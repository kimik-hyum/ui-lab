import React, { useOptimistic, useEffect, useTransition, useState, useRef } from 'react';
import { Todo } from '../types';
import { delayWithError } from '../utils';

interface OptimisticListProps {
  items: Todo[];
  actionTrigger: { id: number; shouldFail: boolean };
  onAddComplete: (newItem: Todo) => void;
}

export function OptimisticList({ items, actionTrigger, onAddComplete }: OptimisticListProps) {
  // [cmp:optimistic-source:start]
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dismissTimerRef = useRef<number | null>(null);
  const [optimisticItems, addOptimisticItem] = useOptimistic(
    items,
    (state: Todo[], newItem: Todo) => [...state, newItem]
  );
  // [cmp:optimistic-source:end]

  useEffect(() => {
    if (actionTrigger.id === 0) return;

    // [cmp:optimistic-concurrency:start]
    // [cmp:optimistic-write-path:start]
    const newItem: Todo = {
      id: crypto.randomUUID(),
      text: `New Item #${actionTrigger.id}`,
      createdAt: Date.now(),
    };

    addOptimisticItem(newItem);
    startTransition(async () => {
      setError(null);
      try {
        await delayWithError(2000, actionTrigger.shouldFail); 
        onAddComplete(newItem);
      } catch {
        console.log("Async action failed. React will auto-revert the optimistic state.");
        setError("Failed to save. Rolling back...");
        
        // Auto-dismiss error after 1s
        if (dismissTimerRef.current) {
          clearTimeout(dismissTimerRef.current);
        }
        dismissTimerRef.current = window.setTimeout(() => setError(null), 1000);
      }
    });
    // [cmp:optimistic-write-path:end]
    // [cmp:optimistic-concurrency:end]
  }, [actionTrigger, addOptimisticItem, onAddComplete]); 

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  return (
    <ul className="space-y-2 relative">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-50 text-red-600 text-xs p-2 rounded mb-2 z-10 border border-red-300">
           ⚠️ {error}
        </div>
      )}
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
                        Sending...
                    </span>
                )}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">ID: {item.id.slice(0, 8)}</div>
          </li>
        );
      })}
    </ul>
  );
}
