import type { ComparisonTopic } from "./ComparisonTypes";

export function ComparisonTopicNotes({ topics }: {
  topics: readonly Pick<ComparisonTopic, "id" | "title" | "description">[];
}) {
  return (
    <section aria-label="코드 해설" className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-800">코드 해설</h2>
      <div className="space-y-2">
        {topics.map((topic) => (
          <details key={topic.id} className="rounded-lg border border-slate-200 bg-slate-50">
            <summary className="min-h-11 cursor-pointer rounded-lg px-4 py-3 text-sm font-medium text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
              {topic.title}
            </summary>
            <div className="border-t border-slate-200 px-4 py-3 text-sm leading-relaxed text-slate-600">
              {topic.description}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
