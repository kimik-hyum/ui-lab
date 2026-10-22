'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { ComparisonTopic } from './ComparisonTypes';
import { ComparisonCodeBlock } from './ComparisonCodeBlock';
import { ComparisonInsightPanel } from './ComparisonInsightPanel';
import { stripAnchorLines } from './codeAnchors';

export type { ComparisonTopic } from './ComparisonTypes';

interface ComparisonTemplateProps {
  title: string;
  description: React.ReactNode;
  leftTitle: string;
  rightTitle: string;
  leftCode: string;
  rightCode: string;
  topics: ComparisonTopic[];
  leftComponent: React.ReactNode;
  rightComponent: React.ReactNode;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
}

export function ComparisonTemplate({
  title, description, leftTitle, rightTitle, leftCode, rightCode, topics,
  leftComponent, rightComponent, headerActions, footer,
}: ComparisonTemplateProps) {
  const [showCode, setShowCode] = useState(false);
  const [mobileSide, setMobileSide] = useState<'left' | 'right'>('left');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(topics[0]?.id ?? null);
  const [hoveredTopicId, setHoveredTopicId] = useState<string | null>(null);
  const leftScrollRef = useRef<HTMLDivElement | null>(null);
  const rightScrollRef = useRef<HTMLDivElement | null>(null);
  const activeTopic = useMemo(
    () => topics.find((topic) => topic.id === (hoveredTopicId ?? selectedTopicId)) ?? null,
    [hoveredTopicId, selectedTopicId, topics],
  );
  const allLeftLines = useMemo(() => topics.flatMap((topic) => topic.leftLines), [topics]);
  const allRightLines = useMemo(() => topics.flatMap((topic) => topic.rightLines), [topics]);

  const scrollToLine = (side: 'left' | 'right', lineNumber?: number) => {
    if (!lineNumber) return;
    const container = side === 'left' ? leftScrollRef.current : rightScrollRef.current;
    const target = container?.querySelector<HTMLElement>(`[data-line="${lineNumber}"]`);
    if (!container || !target || container.clientHeight === 0) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    if (targetRect.top >= containerRect.top + 12 && targetRect.bottom <= containerRect.bottom - 12) return;
    // Scroll the code pane only; selecting an explanation must not move the page.
    container.scrollTo({ top: container.scrollTop + targetRect.top - containerRect.top - container.clientHeight / 3, behavior: 'instant' });
  };

  const handleLineHover = (side: 'left' | 'right', line: number | null) => {
    if (line === null) {
      setHoveredTopicId(null);
      return;
    }
    const topic = topics.find((candidate) => (side === 'left' ? candidate.leftLines : candidate.rightLines).includes(line));
    if (!topic) return;
    setHoveredTopicId(topic.id);
    const sourceLines = side === 'left' ? topic.leftLines : topic.rightLines;
    const targetLines = side === 'left' ? topic.rightLines : topic.leftLines;
    const index = sourceLines.indexOf(line);
    const fraction = sourceLines.length > 1 ? index / (sourceLines.length - 1) : 0;
    const targetLine = targetLines[Math.round(fraction * (targetLines.length - 1))];
    scrollToLine(side === 'left' ? 'right' : 'left', targetLine);
  };

  const selectTopic = (topic: ComparisonTopic) => {
    setSelectedTopicId(topic.id);
    setHoveredTopicId(null);
    scrollToLine('left', topic.leftLines[0]);
    scrollToLine('right', topic.rightLines[0]);
  };

  const changeSide = (side: 'left' | 'right') => {
    setMobileSide(side);
    requestAnimationFrame(() => scrollToLine(side, side === 'left' ? activeTopic?.leftLines[0] : activeTopic?.rightLines[0]));
  };

  return (
    <div className="min-w-0 bg-background text-foreground">
      <div className="flex min-h-[calc(100svh-var(--shell-header-height))] flex-col lg:h-[calc(100dvh-var(--shell-header-height))] lg:min-h-[680px]">
        <header className="shrink-0 border-b border-border bg-white px-5 py-5 sm:px-7 lg:px-8">
          <div className="mb-2 flex items-center gap-2.5 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />FEATURE COMPARISON
            <span className="font-mono font-normal tracking-normal text-subtle-foreground">A / B</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          <div className="mt-2 max-w-5xl text-[13px] leading-relaxed text-muted-foreground">{description}</div>
        </header>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-5 py-3 sm:px-7 lg:px-8">
          <div role="group" aria-label="비교 화면" className="inline-flex rounded-lg bg-surface p-1">
            {([{ label: '실행 결과', value: false }, { label: '코드 비교', value: true }] as const).map((mode) => (
              <button key={mode.label} type="button" aria-pressed={showCode === mode.value} onClick={() => setShowCode(mode.value)}
                className={`min-h-9 rounded-md px-4 text-xs font-semibold transition-colors ${showCode === mode.value ? 'bg-white text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}>
                {mode.value ? <span aria-hidden="true" className="mr-2 font-mono">&lt;/&gt;</span> : <span aria-hidden="true" className="mr-2">◫</span>}{mode.label}
              </button>
            ))}
          </div>
          {headerActions ? <div className="min-w-0 max-w-full [&>div]:flex-wrap [&_button]:min-h-9">{headerActions}</div> : null}
        </div>

        <div role="group" aria-label="비교 대상" className="mx-5 mt-4 grid shrink-0 grid-cols-2 gap-1 rounded-lg border border-border bg-white p-1 sm:mx-7 lg:hidden">
          {(['left', 'right'] as const).map((side) => (
            <button type="button" key={side} aria-label={side === 'left' ? 'A 기존 구현' : 'B 기능 적용'} aria-pressed={mobileSide === side} onClick={() => changeSide(side)}
              className={`min-h-11 min-w-0 rounded-md px-3 text-xs font-semibold ${mobileSide === side ? 'bg-accent-subtle text-accent' : 'text-muted-foreground'}`}>
              <span className="mr-2 font-mono">{side === 'left' ? 'A' : 'B'}</span>{side === 'left' ? '기존 구현' : '기능 적용'}
            </button>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-5 sm:p-7 lg:grid-cols-2 lg:gap-5 lg:p-6">
          {(['left', 'right'] as const).map((side) => {
            const isLeft = side === 'left';
            return (
              <section key={side} aria-label={isLeft ? leftTitle : rightTitle}
                className={`${mobileSide === side ? 'flex' : 'hidden lg:flex'} min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-white`}>
                <div className="flex min-h-16 shrink-0 items-center gap-3 border-b border-border px-4 py-3 lg:px-5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold ${isLeft ? 'bg-surface-elevated text-muted-foreground' : 'bg-accent-subtle text-accent'}`}>{isLeft ? 'A' : 'B'}</span>
                  <div className="min-w-0">
                    <p className="mb-0.5 text-[10px] font-medium tracking-wide text-subtle-foreground">{isLeft ? '기존 구현' : '기능 적용'}</p>
                    <h2 className="text-[13px] font-semibold leading-snug">{isLeft ? leftTitle : rightTitle}</h2>
                  </div>
                </div>
                <div className={`min-h-0 flex-1 overflow-auto ${showCode ? 'p-2.5' : 'p-4 lg:p-5'}`}>
                  {/* Keeping both demos mounted preserves the experiment when changing views. */}
                  <div className={showCode ? 'hidden' : 'h-full min-h-72'}>{isLeft ? leftComponent : rightComponent}</div>
                  <div className={showCode ? 'h-[60svh] min-h-80 lg:h-full lg:min-h-0' : 'hidden'}>
                    {showCode ? <ComparisonCodeBlock code={stripAnchorLines(isLeft ? leftCode : rightCode)} title={isLeft ? 'implementation-a.tsx' : 'implementation-b.tsx'}
                      badge={isLeft ? 'A · 기존 구현' : 'B · 기능 적용'} color={isLeft ? 'red' : 'blue'}
                      highlightedLines={(isLeft ? activeTopic?.leftLines : activeTopic?.rightLines) ?? []}
                      interactiveLines={isLeft ? allLeftLines : allRightLines} onLineHover={(line) => handleLineHover(side, line)}
                      scrollRef={isLeft ? leftScrollRef : rightScrollRef} /> : null}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {showCode ? (
          <section aria-label="코드 비교 포인트" className="min-w-0 shrink-0 border-t border-border bg-white px-5 py-4 sm:px-7 lg:px-8">
            <div className="mb-3 flex min-w-0 items-center gap-4">
              <span className="shrink-0 text-xs font-semibold text-foreground">비교 포인트</span>
              <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
                {topics.map((topic, index) => (
                  <button type="button" key={topic.id} aria-pressed={activeTopic?.id === topic.id} onClick={() => selectTopic(topic)} onFocus={() => selectTopic(topic)}
                    className={`min-h-9 shrink-0 rounded-md border px-3 text-left text-xs transition-colors ${activeTopic?.id === topic.id ? 'border-accent/20 bg-accent-subtle text-accent' : 'border-border text-muted-foreground hover:bg-surface'}`}>
                    <span className="mr-2 font-mono text-[10px] opacity-60">0{index + 1}</span>{topic.title}
                  </button>
                ))}
              </div>
            </div>
            <ComparisonInsightPanel topic={activeTopic} />
          </section>
        ) : (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-white px-5 py-3 text-[11px] text-muted-foreground sm:px-7 lg:px-8">
            <span>같은 조건에서 두 구현을 실행하고 동작을 비교하세요.</span>
            <button type="button" onClick={() => setShowCode(true)} className="min-h-7 font-medium text-accent hover:underline">구현 코드와 {topics.length}개 비교 포인트 보기 <span aria-hidden="true">↗</span></button>
          </div>
        )}
      </div>
      {footer ? <div className="border-t border-border bg-white">{footer}</div> : null}
    </div>
  );
}
