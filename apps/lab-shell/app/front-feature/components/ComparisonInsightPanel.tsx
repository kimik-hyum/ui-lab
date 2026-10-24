import type { ComparisonTopic } from './ComparisonTypes';

interface InsightPanelProps {
  topic: ComparisonTopic | null;
}

export function ComparisonInsightPanel({ topic }: InsightPanelProps) {
  return (
    <div className="h-28 overflow-y-auto rounded-lg border border-border bg-surface px-4 py-3 sm:h-32" tabIndex={0} role="region" aria-label="비교 포인트 설명">
      {topic ? (
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/25 font-mono text-[11px] text-primary">i</span>
          <div className="min-w-0">
            <h3 className="mb-1.5 text-xs font-semibold text-foreground">{topic.title}</h3>
            <div className="text-xs leading-relaxed text-muted-foreground [&_.text-red-300]:text-amber-700 [&_.text-blue-300]:text-primary [&_code]:rounded [&_code]:bg-white [&_code]:px-1 [&_code]:text-foreground">
              {topic.description}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-muted-foreground">비교 포인트를 선택하거나 강조된 코드 줄에 마우스를 올리면 양쪽 구현의 차이를 확인할 수 있습니다.</p>
      )}
    </div>
  );
}
