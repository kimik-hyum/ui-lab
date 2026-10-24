"use client";

import { useMemo, useState } from "react";
import { ComparisonTemplate } from "../../components/ComparisonTemplate";
import { ComparisonTopicNotes } from "../../components/ComparisonTopicNotes";
import type { ComparisonTopic } from "../../components/ComparisonTypes";
import { collectAnchorLines, resolveTopicLines } from "../../components/codeAnchors";
import { CscArticleViewer } from "./components/CscArticleViewer";
import { RscResponseFrame } from "./components/RscResponseFrame";
import { ARTICLE_DELAY_OPTIONS, DEFAULT_ARTICLE_DELAY, resolveArticleDelay } from "./config";

const TOPIC_DEFINITIONS = [
  {
    id: "client-boundary",
    title: "데이터를 가져오는 코드가 어디에서 실행될까",
    description: (
      <div className="space-y-2">
        <p><strong>Client Component · API 요청:</strong> use client 경계 안에서 Effect가 API를 요청합니다. 브라우저가 요청과 화면 갱신을 관리합니다.</p>
        <p><strong>Server Component · HTML 응답:</strong> 서버 페이지가 server-only 컴포넌트를 실행합니다. 데이터 접근 코드를 서버에 둘 수 있습니다. 앱 전체의 JavaScript가 사라진다는 뜻은 아닙니다.</p>
      </div>
    ),
    fallbackLeftLines: [2, 3, 4],
    fallbackRightLines: [1, 2, 3],
  },
  {
    id: "data-fetching",
    title: "JSON 요청과 본문이 담긴 HTML 응답",
    description: (
      <div className="space-y-2">
        <p>Client Component는 화면이 마운트된 뒤 API에서 JSON을 받습니다. Server Component는 새 문서 요청 중 async 컴포넌트가 데이터를 await하고 본문을 렌더링합니다.</p>
        <p>양쪽은 같은 서버 데이터 함수와 인공지연을 사용합니다. Server Component는 아티클용 브라우저 fetch가 필요 없지만, 두 요청의 시작 조건이 달라 표시 순서를 성능 순위로 해석할 수는 없습니다.</p>
      </div>
    ),
    fallbackLeftLines: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 77, 78, 79, 80, 81, 82],
    fallbackRightLines: [6, 7, 8],
  },
  {
    id: "loading-state",
    title: "대기 상태를 관리하는 위치",
    description: (
      <div className="space-y-2">
        <p>Client Component는 JSON 수신까지 15초로 제한하고, 조건 변경·화면 이동 때 이전 요청을 취소합니다. 완료 응답 수에는 화면에 적용한 성공 응답만 포함합니다. 코드 보기에는 요청 helper도 함께 표시합니다.</p>
        <p>Server Component는 데이터 준비 후 본문을 반환하며 별도 아티클 fallback을 두지 않습니다. 바깥의 관찰 화면이 15초 대기를 제한하고 Server Component 응답만 다시 불러오게 합니다. 코드 보기에는 실제 서버 컴포넌트를 표시합니다.</p>
      </div>
    ),
    fallbackLeftLines: [12, 13, 14, 33, 34, 35, 36, 37, 38, 39, 40, 41, 67, 68, 69, 70, 71, 72, 73, 74, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99],
    fallbackRightLines: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  },
];

export function RscClientPage({ cscCode, rscCode }: { cscCode: string; rscCode: string }) {
  const [request, setRequest] = useState({ delay: DEFAULT_ARTICLE_DELAY, run: 0 });
  const topics = useMemo<ComparisonTopic[]>(() => {
    const leftAnchors = collectAnchorLines(cscCode);
    const rightAnchors = collectAnchorLines(rscCode);
    return TOPIC_DEFINITIONS.map((topic) => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      leftLines: resolveTopicLines([topic.id], leftAnchors, topic.fallbackLeftLines),
      rightLines: resolveTopicLines([topic.id], rightAnchors, topic.fallbackRightLines),
    }));
  }, [cscCode, rscCode]);

  return (
    <ComparisonTemplate
      title="클라이언트 요청 vs 서버 데이터 렌더링"
      description="같은 아티클을 useEffect의 API 요청과 실제 async Server Component의 HTML 응답으로 비교합니다. 지연은 서버에서 넣은 관찰용 값입니다."
      leftTitle="Client Component · API 요청"
      rightTitle="Server Component · HTML 응답"
      leftCode={cscCode}
      rightCode={rscCode}
      topics={topics}
      headerActions={
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            공통 서버 인공지연
            <select
              aria-label="아티클 서버 인공지연"
              value={request.delay}
              onChange={(event) => {
                const delay = resolveArticleDelay(event.target.value);
                setRequest((current) => ({ delay, run: current.run + 1 }));
              }}
              className="rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
            >
              {ARTICLE_DELAY_OPTIONS.map((delay) => <option key={delay} value={delay}>{delay}ms</option>)}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setRequest((current) => ({ ...current, run: current.run + 1 }))}
            className="rounded border border-violet-600 bg-violet-600 px-3 py-2 text-sm text-white"
          >
            두 응답 다시 실행
          </button>
        </div>
      }
      leftComponent={<CscArticleViewer delay={request.delay} fetchKey={request.run} />}
      rightComponent={<RscResponseFrame key={request.run} delay={request.delay} run={request.run} />}
      footer={
        <div className="space-y-5 p-6 text-sm leading-7 text-slate-600">
          <p>오른쪽의 새 탭 링크에서 서버가 반환한 본문을 따로 확인할 수 있습니다. 오류·시간 초과 후 오른쪽만 재시도하면 지연 조건과 왼쪽 결과·완료 횟수는 유지됩니다. 번들 크기나 렌더링 시간은 측정하지 않습니다.</p>
          <p>코드 보기에서 UI 보기로 돌아오면 양쪽을 새로 요청하고, 왼쪽의 완료 응답 수는 0부터 다시 셉니다.</p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-4">Client Component도 첫 페이지 요청에서 서버가 HTML을 미리 렌더링할 수 있습니다. 왼쪽의 대기 화면은 Client Component 전체의 특성이 아니라, 이 예제에서 초기 데이터를 useEffect로 요청하도록 선택한 결과입니다.</p>
          <ComparisonTopicNotes topics={topics} />
          <nav aria-label="공식 문서" className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <a href="https://nextjs.org/docs/app/getting-started/server-and-client-components" target="_blank" rel="noreferrer" className="underline underline-offset-4">Next.js · 서버/클라이언트 경계와 초기 HTML ↗</a>
            <a href="https://nextjs.org/docs/app/getting-started/fetching-data" target="_blank" rel="noreferrer" className="underline underline-offset-4">Next.js · 서버 데이터와 대기 경계 ↗</a>
          </nav>
        </div>
      }
    />
  );
}
