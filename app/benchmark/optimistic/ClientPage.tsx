'use client';

import React, { useState, useMemo } from 'react';
import { SplitView } from './components/SplitView';
import { TraditionalList } from './components/TraditionalList';
import { OptimisticList } from './components/OptimisticList';
import { Todo } from './types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface PageProps {
  traditionalCode: string;
  optimisticCode: string;
}

// ----------------------------------------------------------------------
// 1. Comparison Topics (The "Story")
// ----------------------------------------------------------------------

type ComparisonTopic = {
    id: string;
    title: string;
    description: React.ReactNode;
    leftLines: number[];  // TraditionalList.tsx relevant lines
    rightLines: number[]; // OptimisticList.tsx relevant lines
};

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
        leftLines: [13, 14, 18, 19, 20], // useState + useEffect
        rightLines: [16, 17, 18, 19]     // useOptimistic
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
        leftLines: [34, 37, 38], // Backup + SetState
        rightLines: [35]         // addOptimisticItem
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
        leftLines: [51, 52, 53, 54], // catch block manual revert
        rightLines: [42, 43, 44]     // catch block (logging only)
    }
];

// ----------------------------------------------------------------------
// Components
// ----------------------------------------------------------------------

function CodeBlock({ 
    code, 
    title, 
    badge, 
    color, 
    highlightedLines = [],
    interactiveLines = [], // New prop
    onLineHover
}: { 
    code: string, 
    title: string, 
    badge: string, 
    color: 'red' | 'blue',
    highlightedLines?: number[],
    interactiveLines?: number[], // New prop
    onLineHover?: (line: number | null) => void
}) {
    const isRed = color === 'red';

    return (
        <div className="h-full flex flex-col bg-gray-950 rounded-xl overflow-hidden border border-gray-800 animate-in fade-in duration-300">
             <div className="bg-gray-900 px-4 py-3 border-b border-gray-800 flex justify-between items-center shrink-0">
                 <span className={`text-sm font-mono ${isRed ? 'text-red-300' : 'text-blue-300'}`}>{title}</span>
                 <span className={`text-[10px] ${isRed ? 'text-red-400 bg-red-950/30' : 'text-blue-400 bg-blue-900/30'} px-2 py-0.5 rounded border ${isRed ? 'border-red-900' : 'border-blue-900'}`}>
                    {badge}
                 </span>
            </div>
            <div className={`flex-1 overflow-auto custom-scrollbar relative ${isRed ? 'bg-[#1e1e1e]' : 'bg-[#1e1e1e]'}`}>
                <SyntaxHighlighter 
                    language="typescript" 
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '1.5rem', fontSize: '12px', lineHeight: '1.6', background: 'transparent' }}
                    showLineNumbers={true}
                    wrapLines={true}
                    lineProps={(lineNumber) => {
                         const isHighlighted = highlightedLines.includes(lineNumber); // Currently hovered topic
                         const isInteractive = interactiveLines?.includes(lineNumber); // Has any topic

                         return {
                             style: { 
                                 display: 'block', 
                                 // Highlight Logic
                                 backgroundColor: isHighlighted 
                                    ? (isRed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)') 
                                    : (isInteractive ? (isRed ? 'rgba(239, 68, 68, 0.05)' : 'rgba(59, 130, 246, 0.05)') : 'transparent'), // Subtle hint for interactive
                                 
                                 // Border Logic
                                 boxShadow: isHighlighted 
                                    ? (isRed ? 'inset 3px 0 0 0 rgba(239, 68, 68, 0.8)' : 'inset 3px 0 0 0 rgba(59, 130, 246, 0.8)')
                                    : (isInteractive ? (isRed ? 'inset 3px 0 0 0 rgba(239, 68, 68, 0.2)' : 'inset 3px 0 0 0 rgba(59, 130, 246, 0.2)') : 'none'),

                                 cursor: isInteractive ? 'help' : 'text',
                                 transition: 'all 0.2s',
                                 opacity: (highlightedLines.length > 0 && !isHighlighted) ? 0.3 : 1, // Dim others when focusing
                                 
                                 // Add a content hint via pseudo-element simulation? 
                                 // SyntaxHighlighter doesn't support pseudos easily in inline style.
                                 // But the border (boxShadow inset) is a good enough indicator.
                             },
                             onMouseEnter: () => isInteractive && onLineHover?.(lineNumber),
                             onMouseLeave: () => onLineHover?.(null),
                         };
                    }}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}


// ----------------------------------------------------------------------
// Insight Panel
// ----------------------------------------------------------------------

function InsightPanel({ topic }: { topic: ComparisonTopic | null }) {
    if (!topic) return (
        <div className="h-32 flex items-center justify-center text-gray-500 text-sm border-t border-gray-800 bg-gray-900/50">
            <p className="flex items-center gap-2">
                <span className="animate-bounce">👆</span> 
                코드 라인 위에 마우스를 올려 두 방식의 차이점을 확인하세요
            </p>
        </div>
    );

    return (
        <div className="h-32 px-6 py-4 bg-blue-950/20 border-t border-blue-500/30 flex flex-col justify-center animate-in slide-in-from-bottom-2 duration-300 relative overflow-hidden">
            {/* Active Indicator Line */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-gradient-x" />
            
            <h3 className="text-blue-100 font-bold text-sm mb-2 flex items-center gap-2">
                <span className="text-xl">�</span> {topic.title}
            </h3>
            <div className="text-sm text-gray-300 leading-relaxed max-w-4xl">
                {topic.description}
            </div>
        </div>
    );
}

export function ClientPage({ traditionalCode, optimisticCode }: PageProps) {
  // Calculate all interactive lines for indicators
  const allLeftLines = useMemo(() => COMPARISON_TOPICS.flatMap(t => t.leftLines), []);
  const allRightLines = useMemo(() => COMPARISON_TOPICS.flatMap(t => t.rightLines), []);

  const [itemsA, setItemsA] = useState<Todo[]>([]);
  const [itemsB, setItemsB] = useState<Todo[]>([]);
  const [trigger, setTrigger] = useState<{id: number, shouldFail: boolean}>({ id: 0, shouldFail: false });
  const [metrics, setMetrics] = useState<{ a: number | null; b: number | null }>({ a: null, b: null });
  
  const [showLeftCode, setShowLeftCode] = useState(false);
  const [showRightCode, setShowRightCode] = useState(false);

  // Synced Highlighting State
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  const activeTopic = useMemo(() => 
    COMPARISON_TOPICS.find(t => t.id === activeTopicId) || null, 
  [activeTopicId]);

  const handleLineHover = (side: 'left' | 'right', line: number | null) => {
      if (line === null) {
          setActiveTopicId(null);
          return;
      }
      
      // Find which topic covers this line
      const topic = COMPARISON_TOPICS.find(t => {
          const lines = side === 'left' ? t.leftLines : t.rightLines;
          return lines.includes(line);
      });

      if (topic) {
          setActiveTopicId(topic.id);
      }
  };

  const handleAction = () => {
    // ... same logic
    const nextId = trigger.id + 1;
    const shouldFail = Math.random() > 0.5;
    setTrigger({ id: nextId, shouldFail });
    setMetrics({ a: null, b: null });
  };

  const handleAddA = (item: Todo) => setItemsA((prev) => [...prev, item]);
  const handleAddB = (item: Todo) => setItemsB((prev) => [...prev, item]);
  const handleRenderA = (duration: number) => setMetrics((prev) => ({ ...prev, a: duration }));
  const handleRenderB = (duration: number) => setMetrics((prev) => ({ ...prev, b: duration }));

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-gray-800">
      <div className="w-full h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 border-b border-gray-800 flex items-center justify-between shrink-0">
           {/* ... header content same as before ... */}
           <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Optimistic UI Benchmark</h1>
              <p className="text-gray-500 text-sm mt-1">Manual vs. useOptimistic()</p>
           </div>
           <div className="flex items-center gap-4">
                {/* ... metrics display ... */}
                <div className="flex gap-4 text-xs font-mono">
                  <div className="px-3 py-1.5 rounded bg-gray-900 border border-gray-800">
                     <span>Traditional Latency: </span>
                     <span className={metrics.a ? 'text-green-400' : 'text-gray-600'}>
                        {metrics.a ? `${metrics.a.toFixed(2)}ms` : '--'}
                     </span>
                  </div>
                  <div className="px-3 py-1.5 rounded bg-gray-900 border border-gray-800">
                     <span>Optimistic Latency: </span>
                     <span className={metrics.b ? 'text-green-400' : 'text-gray-600'}>
                        {metrics.b ? `${metrics.b.toFixed(2)}ms` : '--'}
                     </span>
                  </div>
                </div>

                <button
                    onClick={handleAction}
                    className="bg-white text-black px-6 py-2 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                    Run Benchmark
                </button>
           </div>
        </header>

        {/* Main Content Area: Flex Grow to fill space */}
        <div className="flex-1 min-h-0 relative">
            <SplitView
                leftTitle="Blocking UI (Manual)"
                rightTitle="Optimistic UI (Auto)"
                onAction={handleAction}
                isResetting={false} // No longer used but required by prop types
                
                leftComponent={
                    showLeftCode ? (
                        <CodeBlock 
                            code={traditionalCode} 
                            title="TraditionalList.tsx" 
                            badge="Manual Rollback Hell" 
                            color="red" 
                            highlightedLines={activeTopic ? activeTopic.leftLines : []}
                            interactiveLines={allLeftLines}
                            onLineHover={(line) => handleLineHover('left', line)}
                        />
                    ) : (
                        <TraditionalList 
                            items={itemsA} 
                            actionTrigger={trigger} 
                            onAddComplete={handleAddA}
                            onRenderComplete={handleRenderA}
                        />
                    )
                }
                rightComponent={
                     showRightCode ? (
                        <CodeBlock 
                            code={optimisticCode} 
                            title="OptimisticList.tsx" 
                            badge="Auto Revert Heaven" 
                            color="blue" 
                            highlightedLines={activeTopic ? activeTopic.rightLines : []}
                            interactiveLines={allRightLines}
                            onLineHover={(line) => handleLineHover('right', line)}
                        />
                    ) : (
                        <OptimisticList 
                            items={itemsB} 
                            actionTrigger={trigger} 
                            onAddComplete={handleAddB}
                            onRenderComplete={handleRenderB}
                        />
                    )
                }
                showLeftCode={showLeftCode}
                showRightCode={showRightCode}
                onToggleLeftCode={() => setShowLeftCode(p => !p)}
                onToggleRightCode={() => setShowRightCode(p => !p)}
            />
        </div>

        {/* Insight Panel (Only visible when at least one code view is open) */}
        {(showLeftCode || showRightCode) && (
            <InsightPanel topic={activeTopic} />
        )}
      </div>
    </div>
  );
}
