// [cmp:client-boundary:start]
import "server-only";
import { loadArticle } from "../article.server";
// 이 파일은 서버 페이지에서만 가져옵니다. 클라이언트 import는 server-only가 차단합니다.
// [cmp:client-boundary:end]
import { ArticleContent } from "./ArticleContent";

// [cmp:data-fetching:start]
export async function RscArticleViewer({ delay }: { delay: number }) {
  // 왼쪽 API와 같은 데이터 함수와 같은 서버 인공지연을 사용합니다.
  const article = await loadArticle(delay);
  // [cmp:data-fetching:end]

  // [cmp:loading-state:start]
  // 데이터를 기다린 뒤 본문을 반환합니다. 이 아티클에는 Suspense fallback이 없습니다.
  return (
    <main
      data-article-source="server"
      data-article-client-fetch="none"
      data-server-delay={delay}
      className="p-4"
    >
      <ArticleContent article={article} />
    </main>
  );
  // [cmp:loading-state:end]
}
