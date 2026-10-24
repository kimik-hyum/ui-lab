// [cmp:client-boundary:start]
"use client";

import { useEffect, useState } from "react";
// [cmp:client-boundary:end]
import { requestArticle, type ArticleRequestResult } from "../request-article";
import { ArticleContent } from "./ArticleContent";

type ResponseState = ArticleRequestResult & { key: string };

export function CscArticleViewer({ delay, fetchKey }: { delay: number; fetchKey: number }) {
  const requestKey = `${delay}:${fetchKey}`;
  // [cmp:loading-state:start]
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const current = response?.key === requestKey ? response : null;
  // [cmp:loading-state:end]

  // [cmp:data-fetching:start]
  useEffect(() => {
    const controller = new AbortController();

    void requestArticle(delay, fetchKey, controller.signal).then((result) => {
      if (!result || controller.signal.aborted) return;
      setResponse({ key: requestKey, ...result });
      if (result.kind === "success") setCompletedCount((count) => count + 1);
    });
    return () => controller.abort();
  }, [delay, fetchKey, requestKey]);
  // [cmp:data-fetching:end]

  return (
    <div className="space-y-3" data-article-source="client-api">
      <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
        <p role="status">{!current ? "API 요청 중" : current.kind === "error" ? "API 요청 실패" : "JSON 수신 완료"}</p>
        <p>완료된 API 응답 · {completedCount}회</p>
      </div>
      {/* [cmp:loading-state:start] */}
      <div className="min-h-[560px] rounded-lg border border-slate-200 p-4">
        {!current ? (
          <p className="text-sm text-slate-500">브라우저에서 아티클을 요청하고 있습니다.</p>
        ) : current.kind === "error" ? (
          <p role="alert" className="text-sm text-red-600">아티클을 불러오지 못했습니다. {current.message} · 위의 다시 실행 버튼으로 재시도하세요.</p>
        ) : (
          <ArticleContent article={current.article} />
        )}
      </div>
      {/* [cmp:loading-state:end] */}
      <p className="text-xs leading-5 text-slate-500">응답 수는 JSON 수신에 성공해 화면에 적용한 횟수입니다. 취소되거나 실패한 요청은 제외합니다.</p>
    </div>
  );
}
