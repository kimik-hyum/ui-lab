import React, { useOptimistic, useEffect, useLayoutEffect, useTransition, useState } from 'react';
import { Todo } from '../types';
import { delayWithError } from '../utils';

interface OptimisticListProps {
  items: Todo[];
  actionTrigger: { id: number; shouldFail: boolean };
  onAddComplete: (newItem: Todo) => void;
  onRenderComplete: (timestamp: number) => void;
}

export function OptimisticList({ items, actionTrigger, onAddComplete, onRenderComplete }: OptimisticListProps) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [optimisticItems, addOptimisticItem] = useOptimistic(
    items,
    (state: Todo[], newItem: Todo) => [...state, newItem]
  );

  useEffect(() => {
    if (actionTrigger.id === 0) return;

    const newItem: Todo = {
      id: crypto.randomUUID(),
      text: `New Item #${actionTrigger.id}`,
      createdAt: Date.now(),
    };

    startTransition(async () => {
      setError(null); 
      try {
        addOptimisticItem(newItem);
        
        await delayWithError(2000, actionTrigger.shouldFail); 
        onAddComplete(newItem);
      } catch {
        console.log("Async action failed. React will auto-revert the optimistic state.");
        setError("Failed to save. Rolling back...");
        
        // Auto-dismiss error after 1s
        setTimeout(() => setError(null), 1000);
      }
    });
  }, [actionTrigger, addOptimisticItem, onAddComplete]); 


  const lastRenderedId = React.useRef(0);

  useLayoutEffect(() => {
    if (actionTrigger.id > 0 && actionTrigger.id !== lastRenderedId.current) {
        if (optimisticItems.length > items.length) {
             onRenderComplete(performance.now());
             lastRenderedId.current = actionTrigger.id;
        }
    }
  }, [optimisticItems, items, actionTrigger, onRenderComplete]);

  return (
    <ul className="space-y-2 relative">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-900/90 text-red-200 text-xs p-2 rounded mb-2 z-10 animate-pulse border border-red-500">
           ⚠️ {error}
        </div>
      )}
      {optimisticItems.map((item) => {
        const isOptimistic = !items.find(i => i.id === item.id);
        
        return (
          <li
            key={item.id}
            className={`
                p-4 rounded-lg shadow-sm border transition-all duration-300
                ${isOptimistic 
                    ? 'bg-blue-900/20 border-blue-500/50 text-blue-100 opacity-90' 
                    : 'bg-gray-800 border-gray-700 text-gray-200'
                }
            `}
          >
            <div className="flex justify-between items-center">
                <span>{item.text}</span>
                {isOptimistic && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-800">
                        Sending...
                    </span>
                )}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">ID: {item.id.slice(0, 8)}</div>
          </li>
        );
      })}
    </ul>
  );
}
