"use client";

import { useMemo, useState } from "react";
import { ComparisonTemplate } from "../../components/ComparisonTemplate";
import type { ComparisonTopic } from "../../components/ComparisonTypes";
import { collectAnchorLines, resolveTopicLines } from "../../components/codeAnchors";
import { DASHBOARD_DELAY_OPTIONS, DEFAULT_DASHBOARD_DELAY, resolveDashboardDelay } from "./config";
import DashboardFrame from "./components/DashboardFrame";
import type { StreamingComparisonProps } from "./types";

const TOPIC_DEFINITIONS = [
  {
    id: "parallel-data",
    title: "같은 요청을 동시에 시작합니다",
    description: (
      <div className="space-y-2">
        <p>양쪽 모두 같은 서버 fixture를 병렬로 불러옵니다. 데이터 종류와 인공지연은 같습니다.</p>
        <p>요청 속도가 아니라 기다리는 위치를 바꿉니다. 직렬 요청을 병렬로 바꾼 효과와 혼동하지 않고 화면 표시 전략을 비교할 수 있습니다.</p>
      </div>
    ),
    fallbackLeftLines: [8, 9],
    fallbackRightLines: [18, 19],
  },
  {
    id: "reveal-boundary",
    title: "페이지 전체에서 기다릴까, 영역마다 기다릴까",
    description: (
      <div className="space-y-2">
        <p><strong>일괄 SSR:</strong> 페이지가 Promise.all을 기다린 뒤 헤더와 데이터를 함께 반환합니다. 화면을 한 번에 완성하는 흐름이 단순합니다.</p>
        <p><strong>스트리밍:</strong> 각 서버 컴포넌트가 자기 데이터만 기다립니다. 빠른 요약이 느린 활동 목록에 막히지 않아 먼저 확인할 수 있습니다.</p>
      </div>
    ),
    fallbackLeftLines: [11, 12],
    fallbackRightLines: [9, 10, 11, 12, 13, 14, 15],
  },
  {
    id: "loading-ui",
    title: "먼저 보여줄 화면에도 설계가 필요합니다",
    description: (
      <div className="space-y-2">
        <p><strong>일괄 SSR:</strong> 서버 데이터가 준비된 화면만 표시하므로 영역별 fallback 코드가 필요하지 않습니다.</p>
        <p><strong>스트리밍:</strong> 헤더와 두 Suspense fallback을 먼저 보냅니다. 사용자는 진행 상황을 알 수 있지만, 경계와 자리 표시자의 크기를 관리해야 화면 흔들림을 줄일 수 있습니다.</p>
      </div>
    ),
    fallbackLeftLines: [14, 15, 16, 17, 18, 19],
    fallbackRightLines: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
  },
];

export default function StreamingClientPage({ blockingCode, streamingCode }: StreamingComparisonProps) {
  const [request, setRequest] = useState({ delay: DEFAULT_DASHBOARD_DELAY, run: 0 });
  const topics = useMemo<ComparisonTopic[]>(() => {
    const leftAnchors = collectAnchorLines(blockingCode);
    const rightAnchors = collectAnchorLines(streamingCode);

    return TOPIC_DEFINITIONS.map((topic) => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      leftLines: resolveTopicLines([topic.id], leftAnchors, topic.fallbackLeftLines),
      rightLines: resolveTopicLines([topic.id], rightAnchors, topic.fallbackRightLines),
    }));
  }, [blockingCode, streamingCode]);

  return (
    <ComparisonTemplate
      title="일괄 SSR vs Suspense 스트리밍"
      description="같은 작업 대시보드를 실제 Next.js 서버 응답으로 비교합니다. 지연은 서버에서 넣은 관찰용 값이며 성능 순위가 아닙니다."
      leftTitle="모두 준비되면 함께 표시"
      rightTitle="헤더부터, 준비된 영역부터 표시"
      leftCode={blockingCode}
      rightCode={streamingCode}
      topics={topics}
      headerActions={
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            서버 인공지연 · 요약 / 활동
            <select
              aria-label="서버 인공지연"
              value={request.delay.summaryMs}
              onChange={(event) => {
                const delay = resolveDashboardDelay(event.target.value);
                setRequest((current) => ({ delay, run: current.run + 1 }));
              }}
              className="rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
            >
              {DASHBOARD_DELAY_OPTIONS.map((delay) => (
                <option key={delay.summaryMs} value={delay.summaryMs}>
                  {delay.summaryMs}ms / {delay.activityMs}ms
                </option>
              ))}
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
      leftComponent={<DashboardFrame key={`blocking-${request.run}`} mode="blocking" delay={request.delay} run={request.run} />}
      rightComponent={<DashboardFrame key={`streaming-${request.run}`} mode="streaming" delay={request.delay} run={request.run} />}
      footer={
        <div className="space-y-5 p-6 text-sm leading-7 text-slate-600">
          <div className="grid gap-4 md:grid-cols-3">
            <div><h2 className="font-semibold text-slate-800">1. 헤더가 나타나는 순간</h2><p>스트리밍은 제목과 대기 화면을 먼저 보냅니다. 일괄 SSR은 데이터가 준비될 때까지 대시보드를 보내지 않습니다.</p></div>
            <div><h2 className="font-semibold text-slate-800">2. 각 데이터가 보이는 순간</h2><p>두 요청은 같은 시점에 시작합니다. 스트리밍의 요약 영역과 활동 목록이 서로 다른 시점에 채워지는지 살펴보세요.</p></div>
            <div><h2 className="font-semibold text-slate-800">3. 코드에서 이유 확인</h2><p>코드 비교 탭에서 강조된 줄의 툴팁으로 차이를 확인하세요.</p></div>
          </div>
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-600">
            모든 실행은 새 HTML 문서를 요청합니다. 인공지연은 서버 데이터 함수에서만 발생하며 클라이언트 타이머로 화면을 꾸미지 않습니다.
            iframe을 동시에 실행하는 관찰용 실험이므로 성능 측정 결과로 사용하지 않습니다. 브라우저나 프록시의 버퍼링에 따라 표시 간격이 달라질 수 있습니다.
          </p>
          <nav aria-label="공식 문서" className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <a href="https://nextjs.org/docs/app/getting-started/fetching-data#streaming" target="_blank" rel="noreferrer" className="underline underline-offset-4">Next.js · 데이터와 스트리밍 ↗</a>
            <a href="https://nextjs.org/docs/app/guides/streaming" target="_blank" rel="noreferrer" className="underline underline-offset-4">Next.js · 경계와 HTTP 응답 ↗</a>
            <a href="https://react.dev/reference/react/Suspense" target="_blank" rel="noreferrer" className="underline underline-offset-4">React · Suspense ↗</a>
          </nav>
        </div>
      }
    />
  );
}
