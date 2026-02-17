import React from 'react';
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
    code,
    title,
    badge,
    color,
    highlightedLines = [],
    interactiveLines = [],
    onLineHover,
    scrollRef
}: CodeBlockProps) {
    const isRed = color === 'red';

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
                className="flex-1 overflow-auto custom-scrollbar relative bg-[#1e1e1e]"
            >
                <SyntaxHighlighter 
                    language="typescript" 
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '1.5rem', fontSize: '12px', lineHeight: '1.6', background: 'transparent' }}
                    showLineNumbers={true}
                    wrapLines={true}
                    lineProps={(lineNumber) => {
                        const isHighlighted = highlightedLines.includes(lineNumber);
                        const isInteractive = interactiveLines?.includes(lineNumber);

                        return {
                            'data-line': lineNumber,
                            style: { 
                                display: 'block', 
                                backgroundColor: isHighlighted 
                                    ? (isRed ? 'rgba(239, 68, 68, 0.35)' : 'rgba(59, 130, 246, 0.35)') 
                                    : (isInteractive ? (isRed ? 'rgba(239, 68, 68, 0.18)' : 'rgba(59, 130, 246, 0.18)') : 'transparent'),
                                boxShadow: isHighlighted 
                                    ? (isRed ? 'inset 4px 0 0 0 rgba(239, 68, 68, 1), inset 0 0 0 1px rgba(239, 68, 68, 0.6)' : 'inset 4px 0 0 0 rgba(59, 130, 246, 1), inset 0 0 0 1px rgba(59, 130, 246, 0.6)')
                                    : (isInteractive ? (isRed ? 'inset 3px 0 0 0 rgba(239, 68, 68, 0.4)' : 'inset 3px 0 0 0 rgba(59, 130, 246, 0.4)') : 'none'),
                                cursor: isInteractive ? 'help' : 'text',
                                transition: 'all 0.2s',
                                opacity: (highlightedLines.length > 0 && !isHighlighted) ? 0.2 : 1,
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
