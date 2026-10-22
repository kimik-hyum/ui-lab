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
  title, description, code, topics, codeTitle = 'Core Hook', codeBadge = 'Single Source', headerActions, preview,
}: CodeInsightTemplateProps) {
  const [activeTopicId, setActiveTopicId] = useState<string | null>(topics[0]?.id ?? null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeTopic = useMemo(() => topics.find((topic) => topic.id === activeTopicId) ?? null, [activeTopicId, topics]);
  const interactiveLines = useMemo(() => [...new Set(topics.flatMap((topic) => topic.lines))], [topics]);

  const handleLineHover = (line: number | null) => {
    if (line === null) return;
    const topic = topics.find((candidate) => candidate.lines.includes(line));
    if (topic) setActiveTopicId(topic.id);
  };

  const selectTopic = (topic: CodeInsightTopic) => {
    setActiveTopicId(topic.id);
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
          <p className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-accent">CODE EXPLORER</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {headerActions ? <div className="flex max-w-full flex-wrap gap-2 [&>div]:flex-wrap [&_a]:inline-flex [&_a]:min-h-9 [&_a]:items-center [&_a]:rounded-lg [&_a]:border-border [&_a]:bg-white [&_a]:text-muted-foreground [&_a:hover]:bg-surface [&_a:hover]:text-accent">{headerActions}</div> : null}
      </header>

      {preview ? <div className="shrink-0 border-b border-border bg-white p-5">{preview}</div> : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label="소스 코드" className="order-2 h-[65svh] min-h-96 min-w-0 lg:order-1 lg:h-full lg:min-h-0">
          <ComparisonCodeBlock code={code} title={codeTitle} badge={codeBadge} color="blue" highlightedLines={activeTopic?.lines ?? []}
            interactiveLines={interactiveLines} onLineHover={handleLineHover} scrollRef={scrollRef} />
        </section>

        <aside aria-label="코드 해설" className="order-1 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-white lg:order-2">
          <div className="shrink-0 border-b border-border px-5 py-4">
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">코드 읽기</h2><span className="rounded-md bg-surface px-2 py-1 font-mono text-[10px] text-muted-foreground">{topics.length} POINTS</span></div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">포인트를 선택하면 해당 코드가 강조됩니다.</p>
          </div>

          <div className="p-4 lg:hidden">
            <label htmlFor="code-insight-topic" className="sr-only">코드 해설 포인트</label>
            <select id="code-insight-topic" value={activeTopicId ?? ''} onChange={(event) => { const topic = topics.find((item) => item.id === event.target.value); if (topic) selectTopic(topic); }}
              className="min-h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground">
              {topics.map((topic, index) => <option key={topic.id} value={topic.id}>{index + 1}. {topic.title}</option>)}
            </select>
          </div>

          <div className="hidden shrink-0 space-y-1.5 border-b border-border p-3 lg:block">
            {topics.map((topic, index) => (
              <button key={topic.id} type="button" aria-pressed={topic.id === activeTopicId} onClick={() => selectTopic(topic)} onFocus={() => selectTopic(topic)}
                className={`flex min-h-11 w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left text-xs leading-relaxed transition-colors ${topic.id === activeTopicId ? 'border-accent/20 bg-accent-subtle text-accent' : 'border-transparent text-muted-foreground hover:bg-surface'}`}>
                <span className="mt-px font-mono text-[10px] opacity-60">0{index + 1}</span><span>{topic.title}</span>
              </button>
            ))}
          </div>
          <div className="min-h-0 overflow-y-auto px-5 pb-5 lg:pt-5">
            {activeTopic ? (
              <div>
                <span className="mb-3 hidden h-1 w-6 rounded-full bg-accent lg:block" />
                <h3 className="text-[13px] font-semibold text-foreground">{activeTopic.title}</h3>
                <div className="mt-3 text-xs leading-7 text-muted-foreground [&_.text-red-300]:text-amber-700 [&_.text-blue-300]:text-accent [&_code]:rounded [&_code]:bg-surface [&_code]:px-1 [&_code]:text-foreground">{activeTopic.description}</div>
              </div>
            ) : <p className="text-xs text-muted-foreground">포인트 또는 강조된 코드 줄을 선택해 보세요.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
