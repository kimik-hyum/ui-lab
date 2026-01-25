'use client';

import React, { useState, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

export type ComparisonTopic = {
    id: string;
    title: string;
    description: React.ReactNode;
    leftLines: number[];
    rightLines: number[];
};

interface ComparisonTemplateProps {
    title: string;
    description: string;
    leftTitle: string;
    rightTitle: string;
    
    // Code
    leftCode: string;
    rightCode: string;
    topics: ComparisonTopic[];

    // Interactive Demo Renderers
    /* 
       We allow the consumer to render the interactive part.
       We manage the split view state (show Code vs show UI).
    */
    leftComponent: React.ReactNode;
    rightComponent: React.ReactNode;
    
    // Header Actions / Metrics (Optional for flexibility)
    headerActions?: React.ReactNode;
    metrics?: {
        leftLatency: number | null;
        rightLatency: number | null;
    };
}

// ----------------------------------------------------------------------
// Sub-Components (Internal)
// ----------------------------------------------------------------------

function CodeBlock({ 
    code, 
    title, 
    badge, 
    color, 
    highlightedLines = [],
    interactiveLines = [],
    onLineHover
}: { 
    code: string, 
    title: string, 
    badge: string, 
    color: 'red' | 'blue',
    highlightedLines?: number[],
    interactiveLines?: number[],
    onLineHover?: (line: number | null, y?: number) => void
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
            <div className="flex-1 overflow-auto custom-scrollbar relative bg-[#1e1e1e]">
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
                             },
                             onMouseEnter: (e) => isInteractive && onLineHover?.(lineNumber, e.clientY),
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

function InsightPanel({ topic, top }: { topic: ComparisonTopic | null, top: number | null }) {
    if (!topic || top === null) return null;

    return (
        <div 
            className="fixed left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 py-5 bg-black/90 backdrop-blur-md border border-blue-500/30 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200"
            style={{ top: `${top + 40}px` }}
        >
            {/* Active Indicator Gradient */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-gradient-x rounded-t-2xl" />
            
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1 p-2 bg-blue-900/30 rounded-lg border border-blue-800/50">
                    <span className="text-xl">💡</span>
                </div>
                <div>
                     <h3 className="text-blue-200 font-bold text-base mb-2">
                        {topic.title}
                    </h3>
                    <div className="text-sm text-gray-300 leading-relaxed">
                        {topic.description}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// Main Template Component
// ----------------------------------------------------------------------

export function ComparisonTemplate({
    title,
    description,
    leftTitle,
    rightTitle,
    leftCode,
    rightCode,
    topics,
    leftComponent,
    rightComponent,
    headerActions,
    metrics
}: ComparisonTemplateProps) {
  const [showCode, setShowCode] = useState(false);

  // Synced Highlighting State
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);

  const activeTopic = useMemo(() => 
    topics.find(t => t.id === activeTopicId) || null, 
  [activeTopicId, topics]);

  // Calculate interactive lines
  const allLeftLines = useMemo(() => topics.flatMap(t => t.leftLines), [topics]);
  const allRightLines = useMemo(() => topics.flatMap(t => t.rightLines), [topics]);

  const handleLineHover = (side: 'left' | 'right', line: number | null, y?: number) => {
      if (line === null) {
          setActiveTopicId(null);
          setHoverY(null);
          return;
      }
      
      if (y) setHoverY(y);

      const topic = topics.find(t => {
          const lines = side === 'left' ? t.leftLines : t.rightLines;
          return lines.includes(line);
      });

      if (topic) {
          setActiveTopicId(topic.id);
      }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-gray-800">
      <div className="w-full h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 border-b border-gray-800 flex items-center justify-between shrink-0">
           <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
              <p className="text-gray-500 text-sm mt-1">{description}</p>
           </div>
           
           <div className="flex items-center gap-4">
                {/* Metrics Display */}
                {metrics && (
                    <div className="flex gap-4 text-xs font-mono">
                    <div className="px-3 py-1.5 rounded bg-gray-900 border border-gray-800">
                        <span>L: </span>
                        <span className={metrics.leftLatency ? 'text-green-400' : 'text-gray-600'}>
                            {metrics.leftLatency ? `${metrics.leftLatency.toFixed(2)}ms` : '--'}
                        </span>
                    </div>
                    <div className="px-3 py-1.5 rounded bg-gray-900 border border-gray-800">
                        <span>R: </span>
                        <span className={metrics.rightLatency ? 'text-green-400' : 'text-gray-600'}>
                            {metrics.rightLatency ? `${metrics.rightLatency.toFixed(2)}ms` : '--'}
                        </span>
                    </div>
                    </div>
                )}

                <button 
                    onClick={() => setShowCode((prev) => !prev)}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors border border-gray-700"
                >
                    {showCode ? '👁️ View UI' : '📝 View Code'}
                </button>
                
                {/* Custom Actions */}
                {headerActions}
           </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
             {/* Left Side */}
            <section className="w-1/2 min-w-0 border-r border-gray-800 flex flex-col relative group">
                <div className="p-4 border-b border-gray-800 bg-gray-950/30 flex items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-400 group-hover:text-gray-200 transition-colors">
                            A. {leftTitle}
                        </h2>
                    </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-gray-900 to-black relative">
                    {showCode ? (
                         <CodeBlock 
                            code={leftCode} 
                            title="Traditional" 
                            badge="Legacy" 
                            color="red" 
                            highlightedLines={activeTopic ? activeTopic.leftLines : []}
                            interactiveLines={allLeftLines}
                            onLineHover={(line, y) => handleLineHover('left', line, y)}
                        />
                    ) : (
                        leftComponent
                    )}
                </div>
            </section>

             {/* Right Side */}
             <section className="w-1/2 min-w-0 flex flex-col relative group">
                <div className="p-4 border-b border-gray-800 bg-gray-950/30 flex items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                            B. {rightTitle}
                        </h2>
                    </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-gray-900 to-blue-950/10 relative">
                     {showCode ? (
                         <CodeBlock 
                            code={rightCode} 
                            title="Optimized" 
                            badge="Modern" 
                            color="blue" 
                            highlightedLines={activeTopic ? activeTopic.rightLines : []}
                            interactiveLines={allRightLines}
                            onLineHover={(line, y) => handleLineHover('right', line, y)}
                        />
                    ) : (
                        rightComponent
                    )}
                </div>
            </section>
        </div>

        {/* Insight Panel (Visible if any code is shown) */}
        {showCode && (
            <InsightPanel topic={activeTopic} top={hoverY} />
        )}
      </div>
    </div>
  );
}
