'use client';

import React, { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  title: string;
  badge: string;
  color: 'red' | 'blue';
  highlightedLines?: number[];
  interactiveLines?: number[];
  onLineHover?: (line: number | null, y?: number) => void;
  scrollRef?: React.Ref<HTMLDivElement>;
}

export function ComparisonCodeBlock({
  code, title, badge, color, highlightedLines = [], interactiveLines = [], onLineHover, scrollRef,
}: CodeBlockProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const isBaseline = color === 'red';

  useEffect(() => {
    if (copyStatus === 'idle') return;
    const timer = window.setTimeout(() => setCopyStatus('idle'), 2200);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-[#303b43] bg-[#182229] text-slate-200">
      <div className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#202b33] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="font-mono text-[10px] text-[#62c7be]">TS</span>
          <span className="truncate font-mono text-[11px] text-slate-200" title={title}>{title}</span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <span className={`hidden rounded border px-1.5 py-0.5 text-[9px] sm:inline ${isBaseline ? 'border-amber-400/20 bg-amber-400/5 text-amber-200' : 'border-teal-400/20 bg-teal-400/5 text-teal-200'}`}>{badge}</span>
          <button type="button" onClick={copyCode} aria-label={`${title} 코드 복사`} className="min-h-7 rounded px-2 text-[10px] text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
            <span aria-live="polite">{copyStatus === 'copied' ? '복사됨' : copyStatus === 'failed' ? '복사 실패' : '복사'}</span>
          </button>
        </div>
      </div>
      <div ref={scrollRef} tabIndex={0} aria-label={`${title} 소스 코드`} className="relative min-h-0 flex-1 overflow-auto overscroll-contain">
        <SyntaxHighlighter language="typescript" style={vscDarkPlus}
          customStyle={{ margin: 0, padding: '1rem 0', fontSize: '12px', lineHeight: '1.85', background: 'transparent', overflow: 'visible', minWidth: 'max-content' }}
          lineNumberStyle={{ minWidth: '3rem', paddingRight: '1.2rem', color: '#72818c', userSelect: 'none' }}
          showLineNumbers wrapLines
          lineProps={(lineNumber) => {
            const isHighlighted = highlightedLines.includes(lineNumber);
            const isInteractive = interactiveLines.includes(lineNumber);
            const accent = isBaseline ? '251, 191, 36' : '45, 212, 191';
            return {
              'data-line': lineNumber,
              style: {
                display: 'block', paddingRight: '1rem', paddingLeft: '0.5rem',
                backgroundColor: isHighlighted ? `rgba(${accent}, 0.12)` : 'transparent',
                boxShadow: isHighlighted ? `inset 2px 0 0 rgba(${accent}, 0.9)` : isInteractive ? `inset 2px 0 0 rgba(${accent}, 0.25)` : 'none',
                cursor: isInteractive ? 'pointer' : 'text',
                transition: 'background-color 120ms ease',
              },
              onMouseEnter: (event) => isInteractive && onLineHover?.(lineNumber, event.clientY),
              onMouseLeave: () => onLineHover?.(null),
              onClick: () => isInteractive && onLineHover?.(lineNumber),
            };
          }}>
          {code}
        </SyntaxHighlighter>
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-white/10 px-3 py-2 font-mono text-[9px] text-slate-400">
        <span>TypeScript / TSX</span><span>{code.split('\n').length} lines</span>
      </div>
    </div>
  );
}
