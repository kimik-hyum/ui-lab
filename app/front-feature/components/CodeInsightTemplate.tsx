'use client';

import React, { useMemo, useRef, useState } from 'react';
import { ComparisonCodeBlock } from './ComparisonCodeBlock';

export type CodeInsightTopic = {
  id: string;
  title: string;
  description: React.ReactNode;
  lines: number[];
};

interface CodeInsightTemplateProps {
  title: string;
  description: string;
  code: string;
  topics: CodeInsightTopic[];
  codeTitle?: string;
  codeBadge?: string;
  headerActions?: React.ReactNode;
  preview?: React.ReactNode;
}

export function CodeInsightTemplate({
  title,
  description,
  code,
  topics,
  codeTitle = 'Core Hook',
  codeBadge = 'Single Source',
  headerActions,
  preview,
}: CodeInsightTemplateProps) {
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastScrolledLineRef = useRef<number | null>(null);

  const activeTopic = useMemo(
    () => topics.find((topic) => topic.id === activeTopicId) ?? null,
    [activeTopicId, topics],
  );

  const interactiveLines = useMemo(
    () => Array.from(new Set(topics.flatMap((topic) => topic.lines))).sort((a, b) => a - b),
    [topics],
  );

  const handleLineHover = (line: number | null) => {
    if (line === null) return;

    const topic = topics.find((candidate) => candidate.lines.includes(line));
    if (topic) {
      setActiveTopicId(topic.id);
    }
  };

  const getLineElement = (lineNumber: number) => {
    const container = scrollRef.current;
    if (!container) return null;

    const target = container.querySelector(`[data-line="${lineNumber}"]`);
    return target instanceof HTMLElement ? target : null;
  };

  const isLineVisibleInContainer = (lineNumber: number) => {
    const container = scrollRef.current;
    const target = getLineElement(lineNumber);
    if (!container || !target) return false;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const padding = 8;

    return (
      targetRect.bottom > containerRect.top + padding &&
      targetRect.top < containerRect.bottom - padding
    );
  };

  const syncScrollToTopic = (topic: CodeInsightTopic) => {
    const targetLine = topic.lines[0];
    if (!targetLine) return;

    if (lastScrolledLineRef.current === targetLine && isLineVisibleInContainer(targetLine)) {
      return;
    }

    if (isLineVisibleInContainer(targetLine)) {
      lastScrolledLineRef.current = targetLine;
      return;
    }

    const targetElement = getLineElement(targetLine);
    if (!targetElement) return;

    lastScrolledLineRef.current = targetLine;
    targetElement.scrollIntoView({ block: 'center', inline: 'nearest' });
  };

  const handleTopicActivate = (topic: CodeInsightTopic) => {
    setActiveTopicId(topic.id);
    syncScrollToTopic(topic);
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-gray-800">
      <div className="w-full h-screen flex flex-col">
        <header className="p-6 border-b border-gray-800 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
            <p className="text-gray-500 text-sm mt-1">{description}</p>
          </div>
          {headerActions ? <div className="flex items-center gap-3">{headerActions}</div> : null}
        </header>

        <div className="flex flex-1 overflow-hidden">
          <section className="w-2/3 min-w-0 border-r border-gray-800 flex flex-col">
            {preview ? <div className="border-b border-gray-800 p-5 bg-gray-950/40">{preview}</div> : null}
            <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-gray-900 to-black">
              <ComparisonCodeBlock
                code={code}
                title={codeTitle}
                badge={codeBadge}
                color="blue"
                highlightedLines={activeTopic?.lines ?? []}
                interactiveLines={interactiveLines}
                onLineHover={(line) => handleLineHover(line)}
                scrollRef={scrollRef}
              />
            </div>
          </section>

          <aside className="w-1/3 min-w-0 flex flex-col bg-gray-950/30">
            <div className="border-b border-gray-800 p-4">
              <h2 className="text-sm font-semibold text-gray-200">핵심 포인트</h2>
              <p className="mt-1 text-xs text-gray-500">항목을 선택하면 관련 코드 라인을 강조합니다.</p>
            </div>

            <div className="p-4 space-y-2 overflow-y-auto border-b border-gray-800">
              {topics.map((topic) => {
                const isActive = topic.id === activeTopic?.id;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onMouseEnter={() => handleTopicActivate(topic)}
                    onFocus={() => handleTopicActivate(topic)}
                    onClick={() => handleTopicActivate(topic)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? 'border-blue-500/60 bg-blue-950/30 text-blue-100'
                        : 'border-gray-800 bg-gray-900/40 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    {topic.title}
                  </button>
                );
              })}
            </div>

            <div className="p-4 overflow-y-auto">
              {activeTopic ? (
                <div className="rounded-xl border border-gray-800 bg-black/40 p-4">
                  <h3 className="text-sm font-semibold text-blue-200">{activeTopic.title}</h3>
                  <div className="mt-2 text-sm text-gray-300 leading-relaxed">{activeTopic.description}</div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">오른쪽 항목 또는 코드 라인을 선택하면 설명을 표시합니다.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
