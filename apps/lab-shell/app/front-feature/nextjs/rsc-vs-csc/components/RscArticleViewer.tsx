// Server Component — 'use client' 없음
// [cmp:client-boundary:start]
// 'use client'가 없으므로 이 컴포넌트는 서버에서만 실행됩니다.
// 컴포넌트 코드는 클라이언트 JavaScript 번들에 포함되지 않습니다.
// [cmp:client-boundary:end]

import type { Article } from '../article';
import { DEMO_ARTICLE } from '../article';

// [cmp:data-fetching:start]
// async 함수로 선언하여 서버에서 직접 데이터를 가져옵니다.
// useEffect, useState 없이 await로 데이터를 직접 읽습니다.
export async function RscArticleViewer() {
  // 서버에서 직접 데이터 소스에 접근 (DB, API, 파일시스템 등)
  const article: Article = await getArticle();
  // [cmp:data-fetching:end]

  // [cmp:loading-state:start]
  // 로딩 상태 불필요 — 데이터가 준비된 후에 렌더링이 시작됩니다.
  // [cmp:loading-state:end]

  return (
    <article>
      <h1>{article.title}</h1>
      <p>{article.intro}</p>
      {article.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
    </article>
  );
}

// [cmp:data-fetching:start]
async function getArticle(): Promise<Article> {
  // 실제 앱: DB 쿼리, 파일 읽기, 외부 API 호출 등
  // 서버에서만 실행되므로 DB 자격증명, 파일 경로 등 비공개 정보 사용 가능
  return DEMO_ARTICLE;
}
// [cmp:data-fetching:end]
