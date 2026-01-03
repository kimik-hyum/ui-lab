import React from 'react';

interface ConcurrentLayoutProps {
  leftTitle: string;
  rightTitle: string;
  leftInput: React.ReactNode;
  rightInput: React.ReactNode;
  leftList: React.ReactNode;
  rightList: React.ReactNode;
  latencyDisplay: React.ReactNode;
}

export function ConcurrentLayout({
  leftTitle,
  rightTitle,
  leftInput,
  rightInput,
  leftList,
  rightList,
  latencyDisplay
}: ConcurrentLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white font-sans">
      {/* Header */}
      <header className="flex flex-col items-center justify-center py-6 border-b border-gray-800 bg-gray-950/50 backdrop-blur-md sticky top-0 z-20">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
          Concurrent / Transition Benchmark
        </h1>
        <p className="text-xs text-gray-500 mt-2">
          Type quickly in both inputs to feel the difference in responsiveness.
        </p>
        
        {/* Latency Meter Overlay Area */}
        <div className="mt-4">
             {latencyDisplay}
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Blocking */}
        <section className="flex-1 flex flex-col border-r border-gray-800 relative">
          <div className="p-4 bg-gray-900 border-b border-gray-800">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-red-400">{leftTitle}</h2>
                <span className="text-[10px] px-2 py-1 rounded bg-red-950/50 text-red-400 border border-red-900">
                    Main Thread Blocked
                </span>
             </div>
             {leftInput}
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-950">
            {leftList}
          </div>
        </section>

        {/* Right: Concurrent */}
        <section className="flex-1 flex flex-col relative">
          <div className="p-4 bg-gray-900 border-b border-gray-800">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-emerald-400">{rightTitle}</h2>
                <span className="text-[10px] px-2 py-1 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-900">
                    Non-Blocking (Transition)
                </span>
             </div>
             {rightInput}
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-950">
            {rightList}
          </div>
        </section>
      </div>
    </div>
  );
}
