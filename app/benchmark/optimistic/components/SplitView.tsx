import React from 'react';

interface SplitViewProps {
  leftTitle: string;
  rightTitle: string;
  leftComponent: React.ReactNode;
  rightComponent: React.ReactNode;
  onAction: () => void;
  isResetting: boolean;
  
  // Independent Code Toggles
  showLeftCode: boolean;
  showRightCode: boolean;
  onToggleLeftCode: () => void;
  onToggleRightCode: () => void;
}

export function SplitView({
  leftTitle,
  rightTitle,
  leftComponent,
  rightComponent,
  onAction,
  isResetting,
  showLeftCode,
  showRightCode,
  onToggleLeftCode,
  onToggleRightCode
}: SplitViewProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      {/* Header / Controls */}
      <header className="flex flex-col items-center justify-center py-8 border-b border-gray-800 bg-gray-950/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Optimistic UI Benchmark
        </h1>
        
        <div className="mb-6 flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
            Simulating Network Latency: 2000ms
        </div>

        
        <button
          onClick={onAction}
          disabled={isResetting}
          className="group relative px-8 py-3 bg-white text-gray-900 font-bold rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity" />
          <span className="flex items-center gap-2">
            🚀 Add New Item
          </span>
        </button>
        <p className="mt-3 text-sm text-gray-400">
          Click button to trigger add action on both sides simultaneously
        </p>
      </header>

      {/* Battle Ground */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Traditional */}
        <section className="flex-1 border-r border-gray-800 flex flex-col relative group">
          <div className="p-4 border-b border-gray-800 bg-gray-950/30 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-400 group-hover:text-gray-200 transition-colors">
                A. {leftTitle}
                </h2>
                <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 border border-gray-700">
                Traditional
                </span>
            </div>
            <button 
                onClick={onToggleLeftCode}
                className="text-xs px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors border border-gray-700"
            >
                {showLeftCode ? '👁️ View UI' : '📝 View Code'}
            </button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-gray-900 to-black relative">
            {leftComponent}
          </div>
        </section>

        {/* Right Side: Optimistic */}
        <section className="flex-1 flex flex-col relative group">
           <div className="p-4 border-b border-gray-800 bg-gray-950/30 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                B. {rightTitle}
                </h2>
                <span className="text-xs px-2 py-1 rounded bg-blue-900/30 text-blue-400 border border-blue-800">
                React 19 / Optimistic
                </span>
            </div>
            <button 
                onClick={onToggleRightCode}
                className="text-xs px-3 py-1.5 rounded-full bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 transition-colors border border-blue-800"
            >
                {showRightCode ? '👁️ View UI' : '📝 View Code'}
            </button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-gray-900 to-blue-950/10 relative">
            {rightComponent}
          </div>
        </section>
      </div>
    </div>
  );
}
