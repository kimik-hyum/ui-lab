'use client';

import { useState, useMemo, useEffect } from 'react';
import type { ComparisonTopic } from '../../components/ComparisonTypes';
import { ComparisonTemplate } from '../../components/ComparisonTemplate';
import { collectAnchorLines, resolveTopicLines } from '../../components/codeAnchors';
import { CscArticleViewer } from './components/CscArticleViewer';
import type { Article } from './article';

const TOPIC_DEFINITIONS = [
  {
    id: 'client-boundary',
    title: "'use client' 경계와 번들 포함",
    description: (
      <div className="space-y-2">
        <p>
          <span className="text-red-600 font-bold">CSC:</span>{' '}
          <code>use client</code> 선언으로 컴포넌트 전체가 클라이언트 번들에 포함됩니다.
          훅(useState, useEffect)과 모든 의존 코드가 브라우저로 전송됩니다.
        </p>
        <p>
          <span className="text-blue-600 font-bold">RSC:</span>{' '}
          <code>use client</code>가 없으면 서버에서만 실행되고, 컴포넌트 코드는
          클라이언트 번들에 포함되지 않아 JS 전송량이 줄어듭니다.
        </p>
      </div>
    ),
    leftAnchors: ['client-boundary'],
    rightAnchors: ['client-boundary'],
    fallbackLeftLines: [1, 2, 3, 4, 8, 9],
    fallbackRightLines: [1, 2, 3, 4, 5, 9],
  },
  {
    id: 'data-fetching',
    title: '데이터 페칭 위치',
    description: (
      <div className="space-y-2">
        <p>
          <span className="text-red-600 font-bold">CSC:</span>{' '}
          <code>useEffect</code> 안에서 <code>fetch()</code>를 호출합니다.
          페이지 HTML이 도착한 후 클라이언트에서 추가 요청이 발생하므로
          로딩 스피너가 보이는 구간이 생깁니다.
        </p>
        <p>
          <span className="text-blue-600 font-bold">RSC:</span>{' '}
          컴포넌트 함수 최상위에서 <code>await</code>로 바로 데이터를 가져옵니다.
          서버에서 렌더링이 완료된 HTML이 한 번에 내려오므로 클라이언트 추가 요청이 없습니다.
        </p>
      </div>
    ),
    leftAnchors: ['data-fetching'],
    rightAnchors: ['data-fetching'],
    fallbackLeftLines: [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
    fallbackRightLines: [12, 13, 14, 15, 38, 39, 40, 41, 42, 43],
  },
  {
    id: 'loading-state',
    title: '로딩 상태 관리',
    description: (
      <div className="space-y-2">
        <p>
          <span className="text-red-600 font-bold">CSC:</span>{' '}
          <code>isLoading</code>, <code>elapsed</code> 등 여러 상태를 직접 선언하고
          로딩 중/완료 분기를 명시적으로 처리해야 합니다.
        </p>
        <p>
          <span className="text-blue-600 font-bold">RSC:</span>{' '}
          데이터가 이미 준비된 상태에서 렌더링이 시작되므로
          로딩 상태 변수가 전혀 필요 없습니다.
          Suspense 경계로 외부에서 폴백을 제어합니다.
        </p>
      </div>
    ),
    leftAnchors: ['loading-state'],
    rightAnchors: ['loading-state'],
    fallbackLeftLines: [13, 14, 15, 16, 17, 39, 40, 41, 42],
    fallbackRightLines: [20, 21],
  },
];

function RscSimulatedViewer({
  article,
  simulatedDelay,
  triggerKey,
}: {
  article: Article;
  simulatedDelay: number;
  triggerKey: number;
}) {
  const requestKey = `${simulatedDelay}:${triggerKey}`;
  const [completedKey, setCompletedKey] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const isLoading = completedKey !== requestKey;
  const phase: 'loading' | 'done' = isLoading ? 'loading' : 'done';

  useEffect(() => {
    const start = performance.now();
    const timer = setTimeout(() => {
      setCompletedKey(requestKey);
      setElapsed(Math.round(performance.now() - start));
    }, simulatedDelay);
    return () => clearTimeout(timer);
  }, [requestKey, simulatedDelay]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-blue-600">
          📦 JS Bundle: 0 B
        </span>
        <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-slate-500">
          🔄 Client fetch: 0회
        </span>
        <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-amber-600">
          ⚙️ 서버 CPU 사용
        </span>
        <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-slate-500">
          ⏱ TTFB 시뮬:{' '}
          {phase === 'loading' ? (
            <span className="text-amber-600">서버 렌더링 중...</span>
          ) : (
            <span className="text-emerald-600">{elapsed}ms</span>
          )}
        </span>
      </div>

      {phase === 'loading' ? (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            서버에서 데이터를 가져오는 중... ({simulatedDelay}ms)
          </div>
          <p className="text-[11px] text-slate-400 italic">
            ※ 이 지연은 TTFB(서버 응답 대기)를 시뮬레이션합니다.
            <br />
            &nbsp;&nbsp;&nbsp;CSC는 이 구간에 이미 빈 페이지가 보입니다.
          </p>
          <div className="h-6 w-3/4 rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-5/6 rounded bg-slate-200" />
        </div>
      ) : (
        <article className="flex flex-col gap-5 text-sm">
          <div>
            <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] text-violet-600">
              ✓ 서버에서 프리렌더됨
            </div>
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

          <p className="text-slate-600 leading-relaxed border-l-2 border-violet-400 pl-3">
            {article.intro}
          </p>

          {article.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="font-semibold text-slate-800 mb-1">{section.heading}</h2>
              <p className="text-slate-600 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </article>
      )}
    </div>
  );
}

const DELAY_OPTIONS = [0, 500, 1000, 2000, 3000];

export function RscClientPage({
  cscCode,
  rscCode,
  prefetchedArticle,
}: {
  cscCode: string;
  rscCode: string;
  prefetchedArticle: Article;
}) {
  const [delay, setDelay] = useState(1000);
  const [refetchKey, setRefetchKey] = useState(0);

  const topics = useMemo<ComparisonTopic[]>(() => {
    const leftAnchorLines = collectAnchorLines(cscCode);
    const rightAnchorLines = collectAnchorLines(rscCode);

    return TOPIC_DEFINITIONS.map((topic) => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      leftLines: resolveTopicLines(topic.leftAnchors, leftAnchorLines, topic.fallbackLeftLines),
      rightLines: resolveTopicLines(topic.rightAnchors, rightAnchorLines, topic.fallbackRightLines),
    }));
  }, [cscCode, rscCode]);

  return (
    <ComparisonTemplate
      title="RSC vs CSC 렌더링 비교"
      description={
        <span>
          동일한 아티클 뷰어를 CSC와 RSC로 구현해 차이를 체감합니다.{' '}
          <span className="text-amber-600">RSC는 서버 CPU를 소비하고, CSC는 클라이언트 기기를 소비합니다.</span>
          {' '}어느 쪽이 낫다기보다 상황에 따라 선택해야 합니다.
        </span>
      }
      leftTitle="Client Component (CSC)"
      rightTitle="Server Component (RSC)"
      leftCode={cscCode}
      rightCode={rscCode}
      topics={topics}
      headerActions={
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">데이터 지연</span>
          <div className="flex gap-1">
            {DELAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDelay(d);
                  setRefetchKey((k) => k + 1);
                }}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  delay === d
                    ? 'bg-violet-600 text-white border border-violet-600'
                    : 'border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {d === 0 ? '0' : `${d / 1000}s`}
              </button>
            ))}
          </div>
          <button
            onClick={() => setRefetchKey((k) => k + 1)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
          >
            재요청
          </button>
        </div>
      }
      leftComponent={
        <CscArticleViewer delay={delay} fetchKey={refetchKey} />
      }
      rightComponent={
        <RscSimulatedViewer
          article={prefetchedArticle}
          simulatedDelay={delay}
          triggerKey={refetchKey}
        />
      }
      footer={<TradeoffSection />}
    />
  );
}

function TradeoffSection() {
  const rows = [
    {
      scenario: 'DB 직접 조회, 비공개 API 호출',
      csc: { label: '별도 API Route 필요', color: 'text-red-600' },
      rsc: { label: '컴포넌트에서 직접 접근 가능', color: 'text-emerald-600' },
    },
    {
      scenario: '대형 라이브러리 (마크다운 파서, 차트 등)',
      csc: { label: '클라이언트 번들에 포함됨', color: 'text-red-600' },
      rsc: { label: '번들에서 완전 제거', color: 'text-emerald-600' },
    },
    {
      scenario: 'SEO가 중요한 콘텐츠 페이지',
      csc: { label: '크롤러가 빈 HTML을 볼 수 있음', color: 'text-amber-600' },
      rsc: { label: '완성된 HTML이 즉시 제공됨', color: 'text-emerald-600' },
    },
    {
      scenario: '실시간 인터랙션 (입력, 드래그, 애니메이션)',
      csc: { label: '서버 왕복 없이 즉시 반응', color: 'text-emerald-600' },
      rsc: { label: '불가 — 상태·이벤트 핸들러 없음', color: 'text-red-600' },
    },
    {
      scenario: '트래픽이 매우 많은 공개 페이지',
      csc: { label: 'CDN 캐시로 서버 부하 최소화', color: 'text-emerald-600' },
      rsc: { label: '매 요청마다 서버 실행 → 비용 주의', color: 'text-amber-600' },
    },
    {
      scenario: '사용자별 개인화 데이터',
      csc: { label: '각 클라이언트가 개별 fetch', color: 'text-slate-500' },
      rsc: { label: '캐시 불가 시 매 요청 서버 실행', color: 'text-amber-600' },
    },
  ];

  return (
    <div className="px-8 py-10">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">트레이드오프 — 언제 무엇을 쓸까</h2>
      <p className="text-sm text-slate-500 mb-6">
        RSC가 무조건 우월하지 않습니다. 서버 CPU 비용을 클라이언트 번들·UX와 교환하는 선택입니다.
        실제로는 페이지 단위 RSC + 인터랙티브 리프 CSC를 혼합하는 구조가 일반적입니다.
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium w-2/5">상황</th>
              <th className="px-4 py-3 text-left text-xs text-red-600 font-medium w-[30%]">CSC</th>
              <th className="px-4 py-3 text-left text-xs text-blue-600 font-medium w-[30%]">RSC</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-slate-200/60 last:border-0 ${
                  i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                }`}
              >
                <td className="px-4 py-3 text-slate-700">{row.scenario}</td>
                <td className={`px-4 py-3 ${row.csc.color}`}>{row.csc.label}</td>
                <td className={`px-4 py-3 ${row.rsc.color}`}>{row.rsc.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="text-slate-700 font-medium">권장 패턴 (Next.js App Router):</span>{' '}
          페이지·레이아웃 수준은 RSC로 데이터를 미리 가져오고,
          클릭·입력 등 인터랙션이 필요한 리프 컴포넌트만 <code className="text-violet-600">use client</code>로 분리합니다.
          트래픽이 높은 공개 페이지라면 RSC에 <code className="text-violet-600">cache</code> 옵션을 적극 활용하세요.
        </p>
      </div>
    </div>
  );
}
