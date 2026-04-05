import React, { useState, useEffect, useRef } from 'react';
import { Todo } from '../types';
import { delayWithError } from '../utils';

interface TraditionalListProps {
  items: Todo[];
  actionTrigger: { id: number; shouldFail: boolean };
  onAddComplete: (newItem: Todo) => void;
}

export function TraditionalList({ items, actionTrigger, onAddComplete }: TraditionalListProps) {
  // [cmp:state-mirroring:start]
  // Manual State Mirroring
  const [localItems, setLocalItems] = useState(items);
  const [error, setError] = useState<string | null>(null);
  const processedActionIdRef = useRef(0);
  const dismissTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);
  // [cmp:state-mirroring:end]

  useEffect(() => {
    // [cmp:manual-trigger-guard:start]
    if (actionTrigger.id === 0 || processedActionIdRef.current === actionTrigger.id) return;
    processedActionIdRef.current = actionTrigger.id;
    // [cmp:manual-trigger-guard:end]

    const addItemWithManualRollback = async () => {
      setError(null);
      
      // [cmp:manual-write-path:start]
      const newItem: Todo = {
        id: crypto.randomUUID(),
        text: `New Item #${actionTrigger.id}`,
        createdAt: Date.now(),
      };

      let previousItems: Todo[] = [];

      setLocalItems((prev) => {
        previousItems = prev;
        return [...prev, newItem];
      });

      try {
        await delayWithError(2000, actionTrigger.shouldFail);
        onAddComplete(newItem);

      } catch (err) {
        console.error("Failed!", err);
        setError("Failed to save. Rolling back...");
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

    addItemWithManualRollback();
  }, [actionTrigger, onAddComplete]);

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
                        Sending...
                    </span>
                )}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">ID: {item.id.slice(0, 8)}</div>
          </li>
        )
      })}
    </ul>
  );
}
