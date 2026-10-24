"use client";

import { useMemo, useState } from "react";
import { ComparisonTemplate } from "../../front-feature/components/ComparisonTemplate";
import { ComparisonTopicNotes } from "../../front-feature/components/ComparisonTopicNotes";
import { collectAnchorLines, resolveTopicLines } from "../../front-feature/components/codeAnchors";
import { SequentialDemo } from "./components/SequentialDemo";
import { ParallelDemo } from "./components/ParallelDemo";

const TOPICS = [
  {
    id: "start",
    title: "같은 입력 · 독립된 작업",
    description: "양쪽에서 같은 두 서버 작업을 실행합니다. 서로의 결과를 사용하지 않는 독립적인 데이터만 동시에 불러올 수 있습니다.",
    fallbackLeft: [6],
    fallbackRight: [6],
  },
  {
    id: "wait",
    title: "차례로 await / Promise.all",
    description: "순차 로딩은 첫 작업이 끝나야 다음 작업을 시작합니다. 동시 로딩은 둘을 먼저 시작하고 함께 기다립니다. 독립된 I/O의 대기 시간이 겹쳐 같은 결과를 더 일찍 준비할 수 있습니다.",
    fallbackLeft: [8, 9],
    fallbackRight: [8, 9, 10, 11],
  },
  {
    id: "result",
    title: "동시 로딩 ≠ 스트리밍",
    description: "둘 다 두 결과를 기다려 HTML을 반환하는 일괄 SSR입니다. 병렬화는 작업을 시작하는 순서, 스트리밍은 준비된 화면을 보내는 시점의 차이입니다. 유지보수 시 두 선택을 별도로 판단해야 합니다.",
    fallbackLeft: [11],
    fallbackRight: [13],
  },
  {
    id: "timing",
    title: "시간과 막대의 근거",
    description: "양쪽 모두 performance.now() 차이로 인공지연을 포함한 작업 구간을 기록합니다. 막대 길이는 각 패널의 축에 비례하므로, 길이만으로 네트워크·첫 화면 속도를 판단할 수 없습니다.",
    fallbackLeft: [26, 27, 28, 32, 33, 34, 58, 59, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91],
    fallbackRight: [28, 29, 30, 34, 35, 36, 60, 61, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93],
  },
];

export function DataLoadingClientPage({ leftCode, rightCode }: { leftCode: string; rightCode: string }) {
  const [delayMs, setDelayMs] = useState(800);
  const [run, setRun] = useState(0);
  const topics = useMemo(() => {
    const left = collectAnchorLines(leftCode);
    const right = collectAnchorLines(rightCode);
    return TOPICS.map((topic) => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      leftLines: resolveTopicLines([topic.id], left, topic.fallbackLeft),
      rightLines: resolveTopicLines([topic.id], right, topic.fallbackRight),
    }));
  }, [leftCode, rightCode]);

  return (
    <ComparisonTemplate
      title="데이터 로딩: 순차 vs 동시"
      description="다시 실행을 눌러 작업 구간의 겹침을 보세요. 코드에서는 await의 위치와 시간 계산을 비교합니다."
      leftTitle="순차 · 완료한 뒤 다음 시작"
      rightTitle="동시 · 함께 시작하고 함께 대기"
      leftCode={leftCode}
      rightCode={rightCode}
      topics={topics}
      headerActions={<div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-slate-500">각 서버 지연 <select aria-label="각 서버 지연" value={delayMs} onChange={(event) => setDelayMs(Number(event.target.value))} className="ml-2 rounded border border-slate-300 bg-white px-2 py-2 text-slate-700"><option value={400}>400ms</option><option value={800}>800ms</option><option value={1200}>1200ms</option></select></label>
        <button onClick={() => setRun((value) => value + 1)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs text-slate-700">다시 실행</button>
      </div>}
      leftComponent={<SequentialDemo delayMs={delayMs} run={run} />}
      rightComponent={<ParallelDemo delayMs={delayMs} run={run} />}
      footer={
        <div className="space-y-3 p-5 text-sm text-slate-500">
          <p><strong>관찰 포인트:</strong> 작업 시작 순서 · 구간의 겹침 · 같은 결과</p>
          <p>
            표시 시간은 인공지연을 포함한 서버 작업 구간입니다. 네트워크·첫 화면 표시 시간이나
            프레임워크 성능 순위가 아닙니다. 서로 의존하는 요청에는 순차 실행이 필요합니다.
          </p>
          <ComparisonTopicNotes topics={topics} />
          <a
            href="https://nextjs.org/docs/app/getting-started/fetching-data#parallel-data-fetching"
            target="_blank"
            rel="noreferrer"
            className="text-violet-600 underline underline-offset-4"
          >
            공식 문서 · 병렬 데이터 로딩
          </a>
        </div>
      }
    />
  );
}
