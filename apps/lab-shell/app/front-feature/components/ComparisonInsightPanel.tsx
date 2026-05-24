import React from 'react';
import type { ComparisonTopic } from './ComparisonTypes';

interface InsightPanelProps {
    topic: ComparisonTopic | null;
    top: number | null;
}

export function ComparisonInsightPanel({ topic, top }: InsightPanelProps) {
    if (!topic || top === null) return null;

    return (
        <div
            className="fixed left-1/2 z-50 w-[min(calc(100vw-3rem),42rem)] -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-6 py-5"
            style={{ top: `${top + 40}px` }}
        >
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1 p-2 bg-violet-50 rounded-lg border border-violet-100">
                    <span className="text-xl">💡</span>
                </div>
                <div>
                    <h3 className="text-slate-900 font-bold text-base mb-2">
                        {topic.title}
                    </h3>
                    <div className="text-sm text-slate-500 leading-relaxed">
                        {topic.description}
                    </div>
                </div>
            </div>
        </div>
    );
}
