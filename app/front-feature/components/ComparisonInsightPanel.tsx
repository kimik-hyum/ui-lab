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
            className="fixed left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 py-5 bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-100 z-50 animate-in fade-in zoom-in-95 duration-200"
            style={{ top: `${top + 40}px` }}
        >
            <div className="absolute top-0 left-0 w-full h-0.5 bg-violet-500 rounded-t-2xl" />

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
