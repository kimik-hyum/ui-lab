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
    id: 'view-options',
    title: 'View JSX에서 훅 옵션 주입',
    description:
      '뷰 레이어에서 pageParamKey, preserveExistingParams, restoreFromUrl 같은 옵션을 한곳에 모아 관리할 수 있습니다. 팀별 URL 정책이 다를 때도 컴포넌트 단에서 정책을 명시적으로 통제할 수 있습니다.',
    anchors: ['view-options'],
    fallbackLines: [18, 47, 60, 61, 62],
  },
  {
    id: 'adapter-factory',
    title: 'Virtuoso 어댑터 팩토리',
    description:
      'react-virtuoso의 rangeChanged, scrollToIndex를 공통 인터페이스로 감싸는 예시입니다. 훅 내부를 수정하지 않고도 virtualization 이벤트를 어댑터에서 흡수할 수 있는 구조를 보여줍니다.',
    anchors: ['adapter-factory'],
    fallbackLines: [90, 104, 114, 123],
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

export function AdapterViewInsightClientPage({ code }: { code: string }) {
  const topics = useMemo<CodeInsightTopic[]>(() => {
    const anchorLines = collectAnchorLines(code);

    return TOPIC_DEFINITIONS.map((topic) => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      lines: resolveTopicLines(topic.anchors, anchorLines, topic.fallbackLines),
    }));
  }, [code]);

  return (
    <CodeInsightTemplate
      title="Adapter + View JSX 예시"
      description="가상화 라이브러리 어댑터와 훅 옵션을 뷰 컴포넌트에서 조합하는 예시 코드입니다."
      code={code}
      topics={topics}
      codeTitle="virtuoso-view-example.tsx"
      codeBadge="adapter example"
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/void-ui/pagination-infinite-scroll/adapter-live"
            className="rounded-full border border-cyan-700 px-3 py-1.5 text-xs text-cyan-200 hover:border-cyan-500 hover:text-white"
          >
            Virtuoso 실행 보기
          </Link>
          <Link
            href="/void-ui/pagination-infinite-scroll"
            className="rounded-full border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-500 hover:text-white"
          >
            데모로 돌아가기
          </Link>
          <Link
            href="/void-ui/pagination-infinite-scroll/hook"
            className="rounded-full border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-500 hover:text-white"
          >
            Hook 해설 보기
          </Link>
        </div>
      }
    />
  );
}
