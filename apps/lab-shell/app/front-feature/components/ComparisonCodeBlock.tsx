'use client';

import React, { useId, useState } from 'react';
import { Prism as SyntaxHighlighter, createElement } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Tooltip, TooltipContent, TooltipTrigger, createTooltipHandle } from '@/components/ui/tooltip';

const codeTheme = { ...vscDarkPlus, comment: { ...vscDarkPlus.comment, color: '#a8b99a' } };

type CodeLineHint = { title: string; description: React.ReactNode };

interface CodeBlockProps {
    code: string;
    title: string;
    sourceLabel?: string;
    badge: string;
    color: 'red' | 'blue';
    highlightedLines?: number[];
    interactiveLines?: number[];
    onLineHover?: (line: number | null, y?: number) => void;
    onLineSelect?: (line: number) => void;
    getLineHint?: (line: number) => CodeLineHint | undefined;
    scrollRef?: React.Ref<HTMLDivElement>;
}

export function ComparisonCodeBlock({
    code,
    title,
    sourceLabel = title,
    badge,
    color,
    highlightedLines = [],
    interactiveLines = [],
    onLineHover,
    onLineSelect,
    getLineHint,
    scrollRef
}: CodeBlockProps) {
    const isRed = color === 'red';
    const [tooltipHandle] = useState(() => createTooltipHandle<CodeLineHint>());
    const tooltipId = useId();

    return (
        <div className="h-full flex flex-col bg-gray-950 rounded-xl overflow-hidden border border-gray-800 animate-in fade-in duration-300">
            <div className="bg-gray-900 px-4 py-3 border-b border-gray-800 flex justify-between items-center shrink-0">
                <span className={`text-sm font-mono ${isRed ? 'text-red-300' : 'text-blue-300'}`}>{title}</span>
                <span className={`text-[10px] ${isRed ? 'text-red-400 bg-red-950/30' : 'text-blue-400 bg-blue-900/30'} px-2 py-0.5 rounded border ${isRed ? 'border-red-900' : 'border-blue-900'}`}>
                    {badge}
                </span>
            </div>
            <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-auto custom-scrollbar relative bg-[#1e1e1e]"
            >
                <SyntaxHighlighter 
                    language="typescript" 
                    style={codeTheme}
                    customStyle={{ margin: 0, padding: '1.5rem', fontSize: '12px', lineHeight: '1.6', background: 'transparent' }}
                    showLineNumbers={true}
                    lineNumberStyle={{ color: '#94a3b8' }}
                    wrapLines={true}
                    renderer={({ rows, stylesheet, useInlineStyles }) => rows.map((node, index) => {
                        const line = Number(node.properties?.['data-line']);
                        const hint = getLineHint?.(line);
                        const element = createElement({ node, stylesheet, useInlineStyles, key: index });
                        return hint && React.isValidElement(element)
                            ? <TooltipTrigger key={index} handle={tooltipHandle} payload={hint} delay={200} aria-describedby={tooltipId} render={element} />
                            : element;
                    })}
                    lineProps={(lineNumber) => {
                        const isHighlighted = highlightedLines.includes(lineNumber);
                        const isInteractive = interactiveLines?.includes(lineNumber);
                        const label = getLineHint?.(lineNumber)?.title;
                        const selectable = isInteractive && Boolean(onLineSelect);
                        // Each contiguous explanation range has a keyboard entry point.
                        const tabStop = selectable && label !== getLineHint?.(lineNumber - 1)?.title;

                        return {
                            'data-line': lineNumber,
                            'data-highlighted': isHighlighted || undefined,
                            'data-interactive': isInteractive || undefined,
                            className: `block border-l-[3px] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white ${
                                isHighlighted ? (isRed ? 'border-red-400 bg-red-500/35' : 'border-blue-400 bg-blue-500/35')
                                    : isInteractive ? (isRed ? 'border-red-400/70 bg-red-500/20' : 'border-blue-400/70 bg-blue-500/20') : 'border-transparent'
                            } ${selectable ? 'cursor-pointer' : isInteractive ? 'cursor-help' : 'cursor-text'}`,
                            role: selectable ? 'button' : undefined,
                            tabIndex: selectable ? (tabStop ? 0 : -1) : undefined,
                            'aria-label': selectable ? `${lineNumber}번 줄 · ${label} · 강조 유지` : undefined,
                            onMouseEnter: (e) => isInteractive && onLineHover?.(lineNumber, e.clientY),
                            onMouseLeave: () => onLineHover?.(null),
                            onFocus: () => isInteractive && onLineHover?.(lineNumber),
                            onBlur: () => onLineHover?.(null),
                            onClick: () => selectable && onLineSelect?.(lineNumber),
                            onKeyDown: (event) => {
                                if (selectable && (event.key === 'Enter' || event.key === ' ')) {
                                    event.preventDefault();
                                    onLineSelect?.(lineNumber);
                                }
                            },
                        };
                    }}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
            <Tooltip handle={tooltipHandle}>
                {({ payload }) => <TooltipContent id={tooltipId}>
                    <p className={`mb-1 text-[11px] font-medium ${isRed ? 'text-red-700' : 'text-blue-700'}`}>{sourceLabel}</p>
                    <p className="font-semibold">{payload?.title}</p>
                    <div className="mt-2 space-y-2 leading-6 text-muted-foreground [&_.text-red-300]:text-red-700 [&_.text-blue-300]:text-blue-700 [&_code]:rounded [&_code]:bg-surface [&_code]:px-1 [&_code]:text-foreground">{payload?.description}</div>
                    {onLineSelect && <p className="mt-2 border-t border-border pt-2 text-[11px] text-muted-foreground">클릭 또는 Enter로 강조 유지</p>}
                </TooltipContent>}
            </Tooltip>
        </div>
    );
}
