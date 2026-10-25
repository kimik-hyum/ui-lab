'use client';

import React, { useMemo, useRef, useState } from 'react';
import { ComparisonCodeBlock } from './ComparisonCodeBlock';
import { resolveLineTopic } from './lineTopics';

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
  title, description, code, topics, codeTitle = 'Core Hook', codeBadge = 'Single Source', headerActions, preview,
}: CodeInsightTemplateProps) {
  const [activeTopicId, setActiveTopicId] = useState<string | null>(topics[0]?.id ?? null);
  const [hoveredTopicId, setHoveredTopicId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeTopic = useMemo(() => topics.find((topic) => topic.id === (hoveredTopicId ?? activeTopicId)) ?? null, [activeTopicId, hoveredTopicId, topics]);
  const interactiveLines = useMemo(() => [...new Set(topics.flatMap((topic) => topic.lines))], [topics]);

  const topicForLine = (line: number) => resolveLineTopic(topics, line, (topic) => topic.lines, activeTopicId);
  const handleLineHover = (line: number | null) => {
    setHoveredTopicId(line === null ? null : topicForLine(line)?.id ?? null);
  };

  const selectTopic = (topic: CodeInsightTopic) => {
    setActiveTopicId(topic.id);
    setHoveredTopicId(null);
    const container = scrollRef.current;
    const target = container?.querySelector<HTMLElement>(`[data-line="${topic.lines[0]}"]`);
    if (!container || !target) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    if (targetRect.top >= containerRect.top + 12 && targetRect.bottom <= containerRect.bottom - 12) return;
    container.scrollTo({ top: container.scrollTop + targetRect.top - containerRect.top - container.clientHeight / 3, behavior: 'instant' });
  };

  return (
    <div className="flex min-h-[calc(100svh-var(--shell-header-height))] min-w-0 flex-col bg-background text-foreground lg:h-[calc(100dvh-var(--shell-header-height))] lg:min-h-[680px]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-white px-5 py-5 sm:px-7 lg:px-8">
        <div className="min-w-0">
          <p className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-primary">CODE EXPLORER</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {headerActions ? <div className="flex max-w-full flex-wrap gap-2 [&>div]:flex-wrap [&_a]:inline-flex [&_a]:min-h-9 [&_a]:items-center [&_a]:rounded-lg [&_a]:border-border [&_a]:bg-white [&_a]:text-muted-foreground [&_a:hover]:bg-surface [&_a:hover]:text-primary">{headerActions}</div> : null}
      </header>

      {preview ? <div className="shrink-0 border-b border-border bg-white p-5">{preview}</div> : null}

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-5 sm:p-7 lg:p-6">
        <div role="group" aria-label="코드 탐색" className="flex shrink-0 flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3">
          <span className="text-xs font-semibold text-foreground">코드 탐색</span>
          <div className="min-w-0 w-full lg:hidden">
            <label htmlFor="code-insight-topic" className="sr-only">이동할 코드</label>
            <select id="code-insight-topic" value={activeTopicId ?? ''} onChange={(event) => { const topic = topics.find((item) => item.id === event.target.value); if (topic) selectTopic(topic); }}
              className="min-h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground">
              {topics.map((topic, index) => <option key={topic.id} value={topic.id}>{index + 1}. {topic.title}</option>)}
            </select>
          </div>
          <div className="hidden min-w-0 flex-wrap gap-2 lg:flex">
            {topics.map((topic, index) => (
              <button key={topic.id} type="button" aria-pressed={topic.id === activeTopicId} onClick={() => selectTopic(topic)} onFocus={() => selectTopic(topic)}
                className={`flex min-h-11 items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left text-xs leading-relaxed transition-colors ${topic.id === activeTopicId ? 'border-primary/20 bg-primary-subtle text-primary' : 'border-border text-muted-foreground hover:bg-surface'}`}>
                <span className="mt-px font-mono text-[10px] opacity-60">0{index + 1}</span><span>{topic.title}</span>
              </button>
            ))}
          </div>
        </div>
        <section aria-label="소스 코드" className="h-[65svh] min-h-96 min-w-0 lg:h-auto lg:min-h-0 lg:flex-1">
          <ComparisonCodeBlock code={code} title={codeTitle} badge={codeBadge} color="blue" highlightedLines={activeTopic?.lines ?? []}
            interactiveLines={interactiveLines} onLineHover={handleLineHover} scrollRef={scrollRef}
            getLineHint={topicForLine}
            onLineSelect={(line) => { const topic = topicForLine(line); if (topic) { setActiveTopicId(topic.id); setHoveredTopicId(null); } }} />
        </section>
      </div>
    </div>
  );
}
