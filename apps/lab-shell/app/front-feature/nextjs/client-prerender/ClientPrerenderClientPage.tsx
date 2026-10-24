"use client";

import { useMemo, useState } from "react";
import { ComparisonTemplate } from "../../components/ComparisonTemplate";
import { ComparisonTopicNotes } from "../../components/ComparisonTopicNotes";
import { collectAnchorLines, resolveTopicLines } from "../../components/codeAnchors";
import { CounterFrame } from "./components/CounterFrame";
import type { ExecutionMode } from "./types";
import styles from "./client-prerender.module.css";

const TOPICS = [
  {
    id: "client-boundary",
    title: "use client도 서버 HTML에 참여",
    description: "양쪽 카운터는 Client Component입니다. use client는 상태·이벤트를 쓰는 경계이며 SSR을 끄는 설정이 아닙니다. 브라우저 전용 코드의 실행 위치를 구분해야 서버 오류를 피할 수 있습니다.",
    left: [9],
    right: [2, 17],
  },
  {
    id: "initial-output",
    title: "첫 HTML의 카운터와 대체 표시",
    description: "기본 사전 렌더링은 카운터를 서버에서 HTML로 만듭니다. next/dynamic · ssr: false는 Client wrapper에서 ssr: false로 카운터를 제외하고 loading을 보냅니다. JS가 실행되지 않으면 ssr: false로 불러온 카운터는 나타나지 않습니다.",
    left: [2, 5],
    right: [7, 8, 9, 10],
  },
  {
    id: "interaction",
    title: "동작은 같은 코드, 시작 방식은 다르게",
    description: "같은 useState·클릭 함수를 공유합니다. 브라우저에서 기본 사전 렌더링은 기존 HTML을 hydrate하고 next/dynamic · ssr: false는 카운터를 새로 렌더링합니다. HTML 표시만으로 이벤트 연결을 판단할 수 없어 실제 버튼 동작을 확인해야 합니다.",
    left: [14, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    right: [22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37],
  },
];

export function ClientPrerenderClientPage({ prerenderedCode, clientOnlyCode }: {
  prerenderedCode: string;
  clientOnlyCode: string;
}) {
  const [execution, setExecution] = useState<ExecutionMode>("html");
  const [run, setRun] = useState(0);
  const topics = useMemo(() => {
    const left = collectAnchorLines(prerenderedCode);
    const right = collectAnchorLines(clientOnlyCode);
    return TOPICS.map((topic) => ({
      id: topic.id,
      title: topic.title,
      description: <p>{topic.description}</p>,
      leftLines: resolveTopicLines([topic.id], left, topic.left),
      rightLines: resolveTopicLines([topic.id], right, topic.right),
    }));
  }, [prerenderedCode, clientOnlyCode]);

  return (
    <ComparisonTemplate
      title="Client Component와 첫 HTML"
      description="같은 카운터의 서버 HTML과 브라우저 실행을 나누어 확인합니다."
      leftTitle="기본 사전 렌더링"
      rightTitle="next/dynamic · ssr: false"
      leftCode={prerenderedCode}
      rightCode={clientOnlyCode}
      topics={topics}
      headerActions={
        <div className={`${styles.controls} flex flex-wrap items-end gap-3`}>
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            실행 조건
            <select
              value={execution}
              onChange={(event) => setExecution(event.target.value as ExecutionMode)}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
            >
              <option value="html">서버 HTML만</option>
              <option value="browser">브라우저 실행</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setRun((value) => value + 1)}
            className="min-h-11 rounded-lg bg-violet-600 px-4 text-sm text-white"
          >
            처음부터 보기
          </button>
          <p className="basis-full text-sm leading-6 text-slate-600">
            {execution === "html"
              ? "JS 실행을 막은 실제 서버 문서입니다. 왼쪽 버튼을 눌러도 숫자는 바뀌지 않고 오른쪽은 대체 표시만 남습니다."
              : "JS 실행을 허용합니다. 카운터가 나타나면 양쪽의 카운트 +1 버튼을 눌러보세요."}
          </p>
        </div>
      }
      leftComponent={<CounterFrame key={`prerender-${execution}-${run}`} kind="prerender" execution={execution} run={run} />}
      rightComponent={<CounterFrame key={`client-only-${execution}-${run}`} kind="client-only" execution={execution} run={run} />}
      footer={
        <div className="space-y-3 p-6 text-sm leading-6 text-slate-500">
          <p>조건 변경·처음부터 보기·코드 화면에서 복귀하면 새 문서를 열어 카운트가 0으로 돌아갑니다. 표시 확인은 DOM 존재 확인이며 hydration 완료 신호가 아닙니다.</p>
          <p>요청마다 서버에서 만드는 문서입니다. 빌드 시 정적 생성이나 속도·번들 크기를 비교하지 않습니다. 서버 HTML만 모드에서는 iframe의 스크립트 실행을 차단합니다.</p>
          <ComparisonTopicNotes topics={topics} />
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <a href="https://nextjs.org/docs/app/guides/lazy-loading#skipping-ssr" target="_blank" rel="noreferrer" className="text-violet-600 underline">Next.js ssr: false ↗</a>
            <a href="https://nextjs.org/docs/app/getting-started/server-and-client-components" target="_blank" rel="noreferrer" className="text-violet-600 underline">Client Component의 첫 로드 ↗</a>
          </div>
        </div>
      }
    />
  );
}
