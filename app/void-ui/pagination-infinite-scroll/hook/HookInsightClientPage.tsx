'use client';

import Link from 'next/link';
import { ReactNode, useMemo } from 'react';
import { CodeInsightTemplate, CodeInsightTopic } from '@/app/front-feature/components/CodeInsightTemplate';

type TopicDefinition = {
  id: string;
  title: string;
  description: ReactNode;
  anchors: string[];
  fallbackLines: number[];
};

const ANCHOR_MARKER_PATTERN = /^\s*\/\/\s*\[cmp:([a-z0-9-]+):(start|end)\]\s*$/i;

const TOPIC_DEFINITIONS: TopicDefinition[] = [
  {
    id: 'load-page-core',
    title: '페이지 로딩 코어',
    description:
      'loadPage는 중복 요청/범위 검증/abort를 한곳에서 처리합니다. 요청 경로가 단일화되어 유지보수가 쉬워지고, 경쟁 상태로 인한 불필요한 네트워크 요청을 줄일 수 있습니다.',
    anchors: ['load-page-core'],
    fallbackLines: [73, 74, 75, 76, 80, 89, 95, 99, 104, 117],
  },
  {
    id: 'observer-strategy',
    title: 'Observer 기반 페이지 추적',
    description:
      '페이지 영역 관찰과 하단 sentinel 관찰을 분리해 현재 페이지 계산과 자동 로드를 독립적으로 제어합니다. 옵션(rootMargin/threshold) 튜닝으로 UX와 성능 균형을 맞추기 쉽습니다.',
    anchors: ['page-observer', 'load-more-observer'],
    fallbackLines: [180, 193, 197, 202, 211, 216, 222],
  },
  {
    id: 'url-state-sync',
    title: 'URL 복원/동기화',
    description:
      'restore effect와 sync effect를 분리해 초기 진입 복원과 런타임 상태 반영을 명확히 나눴습니다. 쿼리 파라미터를 보존하거나 키 이름을 바꿀 수 있어 다른 화면 상태와 충돌을 줄입니다.',
    anchors: ['url-restore', 'url-sync'],
    fallbackLines: [231, 236, 242, 247, 251, 254, 260],
  },
];

const collectAnchorLines = (code: string): Record<string, number[]> => {
  const lines = code.split('\n');
  const rangeMap = new Map<string, { start?: number; end?: number }>();

  lines.forEach((line, index) => {
    const markerMatch = line.match(ANCHOR_MARKER_PATTERN);
    if (!markerMatch) return;

    const markerKey = markerMatch[1];
    const markerType = markerMatch[2];
    const lineNumber = index + 1;
    const current = rangeMap.get(markerKey) ?? {};

    if (markerType === 'start') {
      current.start = lineNumber;
    } else {
      current.end = lineNumber;
    }

    rangeMap.set(markerKey, current);
  });

  const result: Record<string, number[]> = {};
  rangeMap.forEach((range, key) => {
    if (!range.start || !range.end || range.end <= range.start + 1) return;

    const start = range.start + 1;
    const end = range.end - 1;
    result[key] = Array.from({ length: end - start + 1 }, (_, idx) => start + idx).filter(
      (lineNumber) => !ANCHOR_MARKER_PATTERN.test(lines[lineNumber - 1]),
    );
  });

  return result;
};

const resolveTopicLines = (
  anchors: string[],
  anchorLines: Record<string, number[]>,
  fallbackLines: number[],
) => {
  const resolved = anchors.flatMap((anchor) => anchorLines[anchor] ?? []);
  const uniqueSorted = Array.from(new Set(resolved)).sort((a, b) => a - b);
  return uniqueSorted.length > 0 ? uniqueSorted : fallbackLines;
};

export function HookInsightClientPage({ hookCode }: { hookCode: string }) {
  const topics = useMemo<CodeInsightTopic[]>(() => {
    const anchorLines = collectAnchorLines(hookCode);

    return TOPIC_DEFINITIONS.map((topic) => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      lines: resolveTopicLines(topic.anchors, anchorLines, topic.fallbackLines),
    }));
  }, [hookCode]);

  return (
    <CodeInsightTemplate
      title="useHybridInfinite 코드 해설"
      description="하이브리드 인피니티 스크롤의 핵심 훅 구현을 단일 코드 관점에서 분석합니다."
      code={hookCode}
      topics={topics}
      codeTitle="useHybridInfinite.ts"
      codeBadge="headless hook"
      headerActions={
        <Link
          href="/void-ui/pagination-infinite-scroll"
          className="rounded-full border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-500 hover:text-white"
        >
          데모로 돌아가기
        </Link>
      }
    />
  );
}
