'use client';

import React, { useState, useMemo, useRef } from 'react';
import type { ComparisonTopic } from './ComparisonTypes';
import { ComparisonCodeBlock } from './ComparisonCodeBlock';
import { ComparisonInsightPanel } from './ComparisonInsightPanel';

export type { ComparisonTopic } from './ComparisonTypes';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface ComparisonTemplateProps {
    title: string;
    description: React.ReactNode;
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

    // Header Actions (Optional for flexibility)
    headerActions?: React.ReactNode;

    // Footer content rendered below the comparison panels
    footer?: React.ReactNode;
}

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
    footer,
}: ComparisonTemplateProps) {
  const [showCode, setShowCode] = useState(false);

  // Synced Highlighting State
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);
  const leftScrollRef = useRef<HTMLDivElement | null>(null);
  const rightScrollRef = useRef<HTMLDivElement | null>(null);
  const lastSyncRef = useRef<{ side: 'left' | 'right'; line: number; target: number } | null>(null);

  const activeTopic = useMemo(() => 
    topics.find(t => t.id === activeTopicId) || null, 
  [activeTopicId, topics]);

  // Calculate interactive lines
  const allLeftLines = useMemo(() => topics.flatMap(t => t.leftLines), [topics]);
  const allRightLines = useMemo(() => topics.flatMap(t => t.rightLines), [topics]);

  const getLineElement = (side: 'left' | 'right', lineNumber: number) => {
      const container = side === 'left' ? leftScrollRef.current : rightScrollRef.current;
      if (!container) return null;

      const target = container.querySelector(`[data-line="${lineNumber}"]`);
      return target instanceof HTMLElement ? target : null;
  };

  const isLineVisibleInContainer = (side: 'left' | 'right', lineNumber: number) => {
      const container = side === 'left' ? leftScrollRef.current : rightScrollRef.current;
      const target = getLineElement(side, lineNumber);
      if (!container || !target) return false;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const padding = 8;

      return (
          targetRect.bottom > containerRect.top + padding &&
          targetRect.top < containerRect.bottom - padding
      );
  };

  const scrollToLine = (side: 'left' | 'right', lineNumber: number) => {
      const target = getLineElement(side, lineNumber);
      if (!target) return;

      target.scrollIntoView({ block: 'center', inline: 'nearest' });
  };

  const syncScrollToMatch = (side: 'left' | 'right', lineNumber: number, topic: ComparisonTopic) => {
      if (!showCode) return;

      const sourceLines = side === 'left' ? topic.leftLines : topic.rightLines;
      const targetLines = side === 'left' ? topic.rightLines : topic.leftLines;
      const targetSide = side === 'left' ? 'right' : 'left';
      const sourceIndex = sourceLines.indexOf(lineNumber);
      const normalizedIndex = sourceLines.length > 1 && sourceIndex >= 0
          ? sourceIndex / (sourceLines.length - 1)
          : 0;
      const targetIndex = targetLines.length > 1
          ? Math.round(normalizedIndex * (targetLines.length - 1))
          : 0;
      const targetLine = targetLines[targetIndex] ?? targetLines[0];

      if (!targetLine) return;
      if (
          lastSyncRef.current &&
          lastSyncRef.current.side === side &&
          lastSyncRef.current.line === lineNumber &&
          lastSyncRef.current.target === targetLine
      ) {
          return;
      }

      if (isLineVisibleInContainer(targetSide, targetLine)) {
          lastSyncRef.current = { side, line: lineNumber, target: targetLine };
          return;
      }

      lastSyncRef.current = { side, line: lineNumber, target: targetLine };
      scrollToLine(targetSide, targetLine);
  };

  const handleLineHover = (side: 'left' | 'right', line: number | null, y?: number) => {
      if (line === null) {
          setActiveTopicId(null);
          setHoverY(null);
          lastSyncRef.current = null;
          return;
      }
      
      if (y) setHoverY(y);

      const topic = topics.find(t => {
          const lines = side === 'left' ? t.leftLines : t.rightLines;
          return lines.includes(line);
      });

      if (topic) {
          setActiveTopicId(topic.id);
          syncScrollToMatch(side, line, topic);
      }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-gray-800">
      <div className={`w-full flex flex-col ${footer ? 'min-h-screen' : 'h-screen'}`}>
        {/* Header */}
        <header className="p-6 border-b border-gray-800 flex items-center justify-between shrink-0">
           <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
              <p className="text-gray-500 text-sm mt-1">{description}</p>
           </div>
           
           <div className="flex items-center gap-4">
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
                         <ComparisonCodeBlock 
                            code={leftCode} 
                            title="Traditional" 
                            badge="Legacy" 
                            color="red" 
                            highlightedLines={activeTopic ? activeTopic.leftLines : []}
                            interactiveLines={allLeftLines}
                            onLineHover={(line, y) => handleLineHover('left', line, y)}
                            scrollRef={leftScrollRef}
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
                         <ComparisonCodeBlock 
                            code={rightCode} 
                            title="Optimized" 
                            badge="Modern" 
                            color="blue" 
                            highlightedLines={activeTopic ? activeTopic.rightLines : []}
                            interactiveLines={allRightLines}
                            onLineHover={(line, y) => handleLineHover('right', line, y)}
                            scrollRef={rightScrollRef}
                        />
                    ) : (
                        rightComponent
                    )}
                </div>
            </section>
        </div>

        {/* Insight Panel (Visible if any code is shown) */}
        {showCode && (
            <ComparisonInsightPanel topic={activeTopic} top={hoverY} />
        )}
      </div>

      {/* Footer (tradeoff / use-case 등 추가 콘텐츠) */}
      {footer && (
        <div className="border-t border-gray-800 bg-black">
          {footer}
        </div>
      )}
    </div>
  );
}
