import React, { useState, useEffect } from 'react';
import { Todo } from '../types';
import { delayWithError } from '../utils';

interface TraditionalListProps {
  items: Todo[];
  actionTrigger: { id: number; shouldFail: boolean };
  onAddComplete: (newItem: Todo) => void;
  onRenderComplete: (timestamp: number) => void;
}

export function TraditionalList({ items, actionTrigger, onAddComplete, onRenderComplete }: TraditionalListProps) {
  // 1. Manual State Mirroring
  const [localItems, setLocalItems] = useState(items);
  const [error, setError] = useState<string | null>(null);

  // 2. Sync Props to State
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  useEffect(() => {
    if (actionTrigger.id === 0) return;

    const addItemWithManualRollback = async () => {
      setError(null);
      
      const newItem: Todo = {
        id: crypto.randomUUID(),
        text: `New Item #${actionTrigger.id}`,
        createdAt: Date.now(),
      };

      // 3. Manual Backup
      const previousItems = [...localItems];

      // 4. Manual Optimistic Update
      setLocalItems(prev => [...prev, newItem]);
      onRenderComplete(performance.now()); 

      try {
        await delayWithError(2000, actionTrigger.shouldFail);
        onAddComplete(newItem);

      } catch (err) {
        // 5. Manual Rollback
        console.error("Failed!", err);
        setError("Failed to save. Rolling back...");
        setLocalItems(previousItems); 
      }
    };

    addItemWithManualRollback();
  }, [actionTrigger]); 

  return (
    <ul className="space-y-2 relative">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-900/90 text-red-200 text-xs p-2 rounded mb-2 z-10 animate-pulse border border-red-500">
           ⚠️ {error}
        </div>
      )}
      
      {localItems.map((item) => {
         const isConfirmed = items.find(i => i.id === item.id);
         
         return (
          <li
            key={item.id}
            className={`
                p-4 rounded-lg shadow-sm border transition-all duration-300
                ${!isConfirmed 
                    ? 'bg-blue-900/20 border-blue-500/50 text-blue-100 opacity-90' 
                    : 'bg-gray-800 border-gray-700 text-gray-200'
                }
            `}
          >
            <div className="flex justify-between items-center">
                <span>{item.text}</span>
                {!isConfirmed && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-800">
                        Sending...
                    </span>
                )}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">ID: {item.id.slice(0, 8)}</div>
          </li>
        )
      })}
    </ul>
  );
}
