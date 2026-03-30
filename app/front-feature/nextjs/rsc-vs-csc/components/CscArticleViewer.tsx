'use client';
// [cmp:client-boundary:start]
import { useState, useEffect } from 'react';
// [cmp:client-boundary:end]
import type { Article } from '../article';

// [cmp:client-boundary:start]
// 'use client' 선언으로 이 컴포넌트와 모든 의존 코드가
// 클라이언트 JavaScript 번들에 포함됩니다.
export function CscArticleViewer({ delay, fetchKey }: { delay: number; fetchKey: number }) {
// [cmp:client-boundary:end]
  // [cmp:loading-state:start]
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [fetchCount, setFetchCount] = useState(0);
  // [cmp:loading-state:end]

  // [cmp:data-fetching:start]
  useEffect(() => {
    setIsLoading(true);
    setArticle(null);
    setElapsed(null);

    const start = performance.now();

    fetch(`/api/rsc-demo?delay=${delay}`)
      .then((r) => r.json())
      .then((data: Article) => {
        setArticle(data);
        setIsLoading(false);
        setFetchCount((prev) => prev + 1);
        setElapsed(Math.round(performance.now() - start));
      });
  }, [delay, fetchKey]);
  // [cmp:data-fetching:end]

  return (
    <div className="flex flex-col gap-4 h-full">
      <MetricsBadge
        bundleSize="~3.2 KB"
        clientRequests={fetchCount}
        elapsed={elapsed}
        isLoading={isLoading}
      />

      {/* [cmp:loading-state:start] */}
      {isLoading ? (
        <LoadingSkeleton delay={delay} />
      ) : (
        <ArticleView article={article!} />
      )}
      {/* [cmp:loading-state:end] */}
    </div>
  );
}

function MetricsBadge({
  bundleSize,
  clientRequests,
  elapsed,
  isLoading,
}: {
  bundleSize: string;
  clientRequests: number;
  elapsed: number | null;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-[11px]">
      <span className="rounded border border-red-900/60 bg-red-950/40 px-2 py-1 text-red-300">
        📦 JS Bundle: {bundleSize}
      </span>
      <span className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-400">
        🔄 Client fetch: {clientRequests}회
      </span>
      <span className="rounded border border-green-900/60 bg-green-950/40 px-2 py-1 text-green-300">
        💻 서버 CPU: 없음
      </span>
      <span className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-400">
        ⏱ 소요:{" "}
        {isLoading ? (
          <span className="text-amber-400">진행 중...</span>
        ) : elapsed !== null ? (
          <span className="text-green-400">{elapsed}ms</span>
        ) : (
          "—"
        )}
      </span>
    </div>
  );
}

function LoadingSkeleton({ delay }: { delay: number }) {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-2 text-xs text-amber-400">
        <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-ping" />
        클라이언트에서 데이터 요청 중... ({delay}ms 지연)
      </div>
      <div className="h-6 w-3/4 rounded bg-zinc-800" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-4 w-16 rounded-full bg-zinc-800" />
        ))}
      </div>
      <div className="h-4 w-full rounded bg-zinc-800" />
      <div className="h-4 w-5/6 rounded bg-zinc-800" />
      <div className="mt-2 h-5 w-1/2 rounded bg-zinc-800" />
      <div className="h-4 w-full rounded bg-zinc-800" />
      <div className="h-4 w-4/5 rounded bg-zinc-800" />
    </div>
  );
}

function ArticleView({ article }: { article: Article }) {
  return (
    <article className="flex flex-col gap-5 text-sm">
      <div>
        <h1 className="text-lg font-bold text-zinc-100 leading-snug">{article.title}</h1>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
          <span>{article.author}</span>
          <span>·</span>
          <span>{article.date}</span>
          <span>·</span>
          <span>{article.readTime}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <p className="text-zinc-300 leading-relaxed border-l-2 border-zinc-700 pl-3">{article.intro}</p>

      {article.sections.map((section) => (
        <div key={section.heading}>
          <h2 className="font-semibold text-zinc-200 mb-1">{section.heading}</h2>
          <p className="text-zinc-400 leading-relaxed">{section.body}</p>
        </div>
      ))}
    </article>
  );
}
