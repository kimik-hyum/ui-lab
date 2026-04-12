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
  const requestKey = `${delay}:${fetchKey}`;
  // [cmp:loading-state:start]
  const [article, setArticle] = useState<Article | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [fetchCount, setFetchCount] = useState(0);
  const isLoading = loadedKey !== requestKey;
  // [cmp:loading-state:end]

  // [cmp:data-fetching:start]
  useEffect(() => {
    let isCancelled = false;
    const start = performance.now();

    fetch(`/api/rsc-demo?delay=${delay}`)
      .then((r) => r.json())
      .then((data: Article) => {
        if (isCancelled) return;
        setArticle(data);
        setLoadedKey(requestKey);
        setFetchCount((prev) => prev + 1);
        setElapsed(Math.round(performance.now() - start));
      });

    return () => {
      isCancelled = true;
    };
  }, [delay, requestKey]);
  // [cmp:data-fetching:end]

  return (
    <div className="flex flex-col gap-4 h-full">
      <MetricsBadge
        bundleSize="~3.2 KB"
        clientRequests={fetchCount}
        elapsed={isLoading ? null : elapsed}
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
      <span className="rounded border border-red-200 bg-red-50 px-2 py-1 text-red-600">
        📦 JS Bundle: {bundleSize}
      </span>
      <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-slate-500">
        🔄 Client fetch: {clientRequests}회
      </span>
      <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-600">
        💻 서버 CPU: 없음
      </span>
      <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-slate-500">
        ⏱ 소요:{" "}
        {isLoading ? (
          <span className="text-amber-600">진행 중...</span>
        ) : elapsed !== null ? (
          <span className="text-emerald-600">{elapsed}ms</span>
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
      <div className="flex items-center gap-2 text-xs text-amber-600">
        <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-ping" />
        클라이언트에서 데이터 요청 중... ({delay}ms 지연)
      </div>
      <div className="h-6 w-3/4 rounded bg-slate-200" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-4 w-16 rounded-full bg-slate-200" />
        ))}
      </div>
      <div className="h-4 w-full rounded bg-slate-200" />
      <div className="h-4 w-5/6 rounded bg-slate-200" />
      <div className="mt-2 h-5 w-1/2 rounded bg-slate-200" />
      <div className="h-4 w-full rounded bg-slate-200" />
      <div className="h-4 w-4/5 rounded bg-slate-200" />
    </div>
  );
}

function ArticleView({ article }: { article: Article }) {
  return (
    <article className="flex flex-col gap-5 text-sm">
      <div>
        <h1 className="text-lg font-bold text-slate-900 leading-snug">{article.title}</h1>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
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
              className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <p className="text-slate-600 leading-relaxed border-l-2 border-slate-300 pl-3">{article.intro}</p>

      {article.sections.map((section) => (
        <div key={section.heading}>
          <h2 className="font-semibold text-slate-800 mb-1">{section.heading}</h2>
          <p className="text-slate-600 leading-relaxed">{section.body}</p>
        </div>
      ))}
    </article>
  );
}
