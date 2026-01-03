'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ConcurrentLayout } from './components/ConcurrentLayout';
import HeavyList from './components/HeavyList';
import { SyncInput } from './components/SyncInput';
import { ConcurrentInput } from './components/ConcurrentInput';
import { generateItems } from './utils';

// Generate heavy dataset once (5000 items with complex rendering = heavy load)
const ITEMS = generateItems(5000); 

export default function ConcurrentPage() {
  const [syncQuery, setSyncQuery] = useState('');
  const [concurrentQuery, setConcurrentQuery] = useState('');
  
  // Latency Metrics
  const lastKeyTime = useRef(0);
  const [latency, setLatency] = useState(0);
  const [mode, setMode] = useState<'Sync' | 'Concurrent' | null>(null);

  const handleKeyDown = (currentMode: 'Sync' | 'Concurrent') => {
    lastKeyTime.current = performance.now();
    setMode(currentMode);
  };

  // Measure latency after render
  useEffect(() => {
    if (lastKeyTime.current > 0) {
      const now = performance.now();
      const delta = now - lastKeyTime.current;
      setLatency(delta);
      lastKeyTime.current = 0; // Reset
    }
  });

  const getLatencyColor = (ms: number) => {
    if (ms < 16) return 'text-emerald-400';
    if (ms < 50) return 'text-yellow-400';
    return 'text-red-500';
  };

  return (
    <ConcurrentLayout
      leftTitle="A. Blocking Rendering"
      rightTitle="B. Concurrent Rendering"
      
      leftInput={
        <SyncInput 
          value={syncQuery} 
          onChange={setSyncQuery} 
          onKeyDown={() => handleKeyDown('Sync')}
        />
      }
      leftList={<HeavyList items={ITEMS} query={syncQuery} />}
      
      rightInput={
        <ConcurrentInput 
          value={concurrentQuery} // Pass current query state for list
          setQuery={setConcurrentQuery} 
          onKeyDown={() => handleKeyDown('Concurrent')}
        />
      }
      rightList={<HeavyList items={ITEMS} query={concurrentQuery} />}
      
      latencyDisplay={
        <div className="flex flex-col items-center bg-gray-900 border border-gray-800 rounded-xl px-6 py-3 shadow-2xl">
            <span className="text-[10px] uppercase text-gray-500 tracking-wider font-bold mb-1">
                Last Input Latency
            </span>
            <div className={`text-4xl font-black font-mono flex items-baseline gap-1 ${getLatencyColor(latency)}`}>
                {Math.round(latency)}
                <span className="text-sm font-bold text-gray-600">ms</span>
            </div>
            {mode && (
                <span className={`text-xs mt-1 px-2 py-0.5 rounded ${mode === 'Sync' ? 'bg-red-900/30 text-red-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                    Mode: {mode}
                </span>
            )}
        </div>
      }
    />
  );
}
