'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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
  codeActions?: React.ReactNode;
}

export function ComparisonTemplate({
  title, description, leftTitle, rightTitle, leftCode, rightCode, topics,
  leftComponent, rightComponent, headerActions, footer, codeActions,
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

  const scrollToLine = useCallback((side: 'left' | 'right', lineNumber?: number) => {
    if (!lineNumber) return;
    const container = side === 'left' ? leftScrollRef.current : rightScrollRef.current;
    const target = container?.querySelector<HTMLElement>(`[data-line="${lineNumber}"]`);
    if (!container || !target || container.clientHeight === 0) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    if (targetRect.top >= containerRect.top + 12 && targetRect.bottom <= containerRect.bottom - 12) return;
    // Scroll the code pane only; selecting an explanation must not move the page.
    container.scrollTo({ top: container.scrollTop + targetRect.top - containerRect.top - container.clientHeight / 3, behavior: 'instant' });
  }, []);

  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId);
  // Base UI mounts the panel after changing tabs; restore its position on mount.
  const attachLeftCode = useCallback((node: HTMLDivElement | null) => {
    leftScrollRef.current = node;
    if (node) requestAnimationFrame(() => scrollToLine('left', selectedTopic?.leftLines[0]));
  }, [scrollToLine, selectedTopic]);
  const attachRightCode = useCallback((node: HTMLDivElement | null) => {
    rightScrollRef.current = node;
    if (node) requestAnimationFrame(() => scrollToLine('right', selectedTopic?.rightLines[0]));
  }, [scrollToLine, selectedTopic]);

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

  const changeView = (value: unknown) => {
    setHoveredTopicId(null);
    setShowCode(value === 'code');
  };

  return (
    <div className="min-w-0 bg-background text-foreground">
      <Tabs value={showCode ? "code" : "preview"} onValueChange={changeView} className="gap-0">
        <header className="shrink-0 border-b border-border bg-white px-5 py-5 sm:px-7 lg:px-8">
          <div className="mb-2 flex items-center gap-2.5 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />FEATURE COMPARISON
            <span className="font-mono font-normal tracking-normal text-subtle-foreground">A / B</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          <div className="mt-2 max-w-5xl text-[13px] leading-relaxed text-muted-foreground">{description}</div>
        </header>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-5 py-3 sm:px-7 lg:px-8">
          <TabsList aria-label="비교 화면" className="h-11">
            <TabsTrigger value="preview" className="px-4 data-active:text-primary">실행 결과</TabsTrigger>
            <TabsTrigger value="code" className="px-4 data-active:text-primary">코드 비교</TabsTrigger>
          </TabsList>
          {(showCode ? codeActions : headerActions) ? <div className="min-w-0 max-w-full [&>div]:flex-wrap">{showCode ? codeActions : headerActions}</div> : null}
        </div>

        <div role="group" aria-label="비교 대상" className="mx-5 mt-4 grid shrink-0 grid-cols-2 gap-1 rounded-lg border border-border bg-white p-1 sm:mx-7 lg:hidden">
          {(['left', 'right'] as const).map((side) => (
            <Button variant="ghost" type="button" key={side} aria-label={side === 'left' ? 'A 기존 구현' : 'B 기능 적용'} aria-pressed={mobileSide === side} onClick={() => changeSide(side)}
              className={`min-h-11 min-w-0 rounded-md px-3 text-xs font-semibold ${mobileSide === side ? 'bg-primary-subtle text-primary' : 'text-muted-foreground'}`}>
              <span className="mr-2 font-mono">{side === 'left' ? 'A' : 'B'}</span>{side === 'left' ? '기존 구현' : '기능 적용'}
            </Button>
          ))}
        </div>

        {(['preview', 'code'] as const).map((mode) => <TabsContent key={mode} value={mode} className="m-0">
          <div className="grid min-w-0 grid-cols-1 gap-4 p-5 sm:p-7 lg:grid-cols-2 lg:p-6">
            {(['left', 'right'] as const).map((side) => {
              const isLeft = side === 'left';
              return <section key={side} aria-label={isLeft ? leftTitle : rightTitle} className={`${mobileSide === side ? 'flex' : 'hidden lg:flex'} min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card`}>
                <div className="flex min-h-16 items-center gap-3 border-b border-border px-5 py-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold ${isLeft ? 'bg-surface-elevated text-muted-foreground' : 'bg-primary-subtle text-primary'}`}>{isLeft ? 'A' : 'B'}</span>
                  <div className="min-w-0"><p className="mb-0.5 text-xs text-muted-foreground">{isLeft ? '기존 구현' : '비교 구현'}</p><h2 className="text-sm font-semibold">{isLeft ? leftTitle : rightTitle}</h2></div>
                </div>
                {mode === 'preview' ? <div className="min-h-64 p-4 lg:p-5">{isLeft ? leftComponent : rightComponent}</div> : <div className="h-[clamp(360px,55dvh,640px)] min-w-0 p-2.5">
                  <ComparisonCodeBlock code={stripAnchorLines(isLeft ? leftCode : rightCode)} title={isLeft ? 'A · 기존 구현' : 'B · 비교 구현'} badge="TSX" color={isLeft ? 'red' : 'blue'}
                    highlightedLines={(isLeft ? activeTopic?.leftLines : activeTopic?.rightLines) ?? []} interactiveLines={isLeft ? allLeftLines : allRightLines}
                    onLineHover={(line) => handleLineHover(side, line)} scrollRef={isLeft ? attachLeftCode : attachRightCode} />
                </div>}
              </section>;
            })}
          </div>
        </TabsContent>)}

        {showCode ? (
          <section aria-label="코드 비교 포인트" className="min-w-0 shrink-0 border-t border-border bg-white px-5 py-4 sm:px-7 lg:px-8">
            <div className="mb-3 flex min-w-0 items-center gap-4">
              <span className="shrink-0 text-xs font-semibold text-foreground">비교 포인트</span>
              <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
                {topics.map((topic, index) => (
                  <button type="button" key={topic.id} aria-pressed={activeTopic?.id === topic.id} onClick={() => selectTopic(topic)} onMouseEnter={() => selectTopic(topic)} onFocus={() => selectTopic(topic)}
                    className={`min-h-9 shrink-0 rounded-md border px-3 text-left text-xs transition-colors ${activeTopic?.id === topic.id ? 'border-primary/20 bg-primary-subtle text-primary' : 'border-border text-muted-foreground hover:bg-surface'}`}>
                    <span className="mr-2 font-mono text-[10px] opacity-60">0{index + 1}</span>{topic.title}
                  </button>
                ))}
              </div>
            </div>
            <div className="comparison-description"><ComparisonInsightPanel topic={activeTopic} /></div>
          </section>
        ) : (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-white px-5 py-3 text-[11px] text-muted-foreground sm:px-7 lg:px-8">
            <span>같은 조건에서 두 구현을 실행하고 동작을 비교하세요.</span>
            <button type="button" onClick={() => changeView('code')} className="min-h-7 font-medium text-primary hover:underline">구현 코드와 {topics.length}개 비교 포인트 보기 <span aria-hidden="true">↗</span></button>
          </div>
        )}
      </Tabs>
      {footer ? <div className="border-t border-border bg-white">{footer}</div> : null}
    </div>
  );
}
