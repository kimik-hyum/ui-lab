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
    title: '요청과 재시도',
    description:
      '진행 중인 요청은 하나로 제한합니다. 실패하면 기존 목록을 유지하고 같은 페이지를 다시 요청하며, 화면을 떠난 뒤 도착한 응답은 무시합니다.',
    anchors: ['load-page-core'],
    fallbackLines: [73, 74, 75, 76, 80, 89, 95, 99, 104, 117],
  },
  {
    id: 'observer-strategy',
    title: '현재 페이지와 자동 로딩',
    description:
      '현재 페이지 추적과 다음 페이지 로딩을 따로 관찰합니다. 요청 실패 시 자동 로딩을 멈춰 불필요한 재요청을 막고, 재시도가 성공하면 다시 이어갑니다.',
    anchors: ['page-observer', 'load-more-observer'],
    fallbackLines: [180, 193, 197, 202, 211, 216, 222],
  },
  {
    id: 'previous-content',
    title: '이전 콘텐츠와 읽던 위치',
    description:
      '첫 클릭 이후에만 위쪽 스크롤로 이전 페이지를 가져옵니다. DOM 목록은 기존 요소의 위치 차이를 보정하고, 가상 목록은 어댑터와 firstItemIndex로 위치를 유지합니다. 페이지 이동 시 자동 로딩을 다시 잠급니다.',
    anchors: ['load-previous'],
    fallbackLines: [190, 191, 192],
  },
  {
    id: 'url-state-sync',
    title: 'URL 복원/동기화',
    description:
      '처음 열 때 주소의 페이지를 복원하고, 스크롤할 때 현재 페이지를 주소에 반영합니다. 다른 쿼리 조건은 보존해 새로고침과 링크 공유에 사용합니다.',
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
      description="추가 로딩, 실패 복구, 페이지 복원을 실제 훅 코드에서 확인합니다."
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
