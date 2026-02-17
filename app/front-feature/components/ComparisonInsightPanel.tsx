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
            className="fixed left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 py-5 bg-black/90 backdrop-blur-md border border-blue-500/30 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200"
            style={{ top: `${top + 40}px` }}
        >
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-gradient-x rounded-t-2xl" />
            
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1 p-2 bg-blue-900/30 rounded-lg border border-blue-800/50">
                    <span className="text-xl">💡</span>
                </div>
                <div>
                    <h3 className="text-blue-200 font-bold text-base mb-2">
                        {topic.title}
                    </h3>
                    <div className="text-sm text-gray-300 leading-relaxed">
                        {topic.description}
                    </div>
                </div>
            </div>
        </div>
    );
}
