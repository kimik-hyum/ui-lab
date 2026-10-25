"use client";

import { useMemo, useState } from "react";
import { ComparisonTemplate } from "../../components/ComparisonTemplate";
import { collectAnchorLines, resolveTopicLines } from "../../components/codeAnchors";
import { ResponseFrame } from "./components/ResponseFrame";
import type { ReadPattern } from "./types";
import styles from "./request-cache.module.css";

const TOPICS = [
  {
    id: "shared-function",
    title: "한 서버 요청 안에서 결과 재사용",
    description: "일반 서버 함수는 호출할 때마다 함수를 실행합니다. React cache()는 모듈에서 한 번 만든 cache 함수를 공유해 같은 인자의 중복 작업을 줄입니다. 서버 컴포넌트 안에서 호출해야 적용됩니다.",
    left: [9],
    right: [9, 15, 16, 17, 18, 19],
  },
  {
    id: "argument-key",
    title: "같은 팀과 다른 팀을 구분",
    description: "양쪽 모두 문자열 팀 ID 세 개를 전달합니다. React cache()는 같은 ID끼리 결과를 공유하고 다른 팀은 따로 실행합니다. 새 객체를 매번 인자로 만들면 참조가 달라 재사용되지 않을 수 있습니다.",
    left: [8, 16, 17, 18],
    right: [8, 24, 25, 26],
  },
  {
    id: "execution-id",
    title: "새 응답에서는 다시 실행",
    description: "ID는 실제 공통 함수에서 생성합니다. React cache()의 결과는 서버 요청 사이에 유지되지 않으므로 새 응답에서는 ID가 달라집니다. 영속 캐시나 브라우저 캐시를 관리하는 코드가 아닙니다.",
    left: [31, 32, 33, 34],
    right: [39, 40, 41, 42],
  },
];

export function RequestCacheClientPage({ directCode, cachedCode }: { directCode: string; cachedCode: string }) {
  const [request, setRequest] = useState<{ pattern: ReadPattern; run: number }>({ pattern: "same", run: 0 });
  const topics = useMemo(() => {
    const left = collectAnchorLines(directCode);
    const right = collectAnchorLines(cachedCode);
    return TOPICS.map((topic) => ({
      id: topic.id,
      title: topic.title,
      description: <p>{topic.description}</p>,
      leftLines: resolveTopicLines([topic.id], left, topic.left),
      rightLines: resolveTopicLines([topic.id], right, topic.right),
    }));
  }, [directCode, cachedCode]);
  return (
    <ComparisonTemplate
      title="React cache · 같은 데이터를 다시 읽으면?"
      description="세 카드가 같은 서버 함수를 호출합니다. 반환된 실행 ID로 한 요청 안의 재사용을 확인합니다."
      leftTitle="일반 서버 함수"
      rightTitle="React cache()"
      leftCode={directCode}
      rightCode={cachedCode}
      topics={topics}
      headerActions={
        <div className={`${styles.controls} flex flex-wrap items-end gap-3`}>
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            카드의 팀 조건
            <select
              aria-label="카드의 팀 조건"
              value={request.pattern}
              onChange={(event) => setRequest((value) => ({ pattern: event.target.value as ReadPattern, run: value.run + 1 }))}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
            >
              <option value="same">모두 같은 팀</option>
              <option value="mixed">한 카드만 다른 팀</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setRequest((value) => ({ ...value, run: value.run + 1 }))}
            className="min-h-11 rounded-lg bg-violet-600 px-4 text-sm text-white"
          >새 응답 요청</button>
        </div>
      }
      leftComponent={<ResponseFrame key={`direct-${request.run}`} mode="direct" {...request} />}
      rightComponent={<ResponseFrame key={`cached-${request.run}`} mode="cached" {...request} />}
      footer={
        <div className="space-y-3 p-6 text-sm leading-6 text-slate-500">
          <p>같은 팀의 ID를 비교한 뒤 한 카드의 팀을 바꾸거나 새 응답을 요청하세요. 코드 화면을 오가면 선택 조건은 유지되지만 서버 문서는 새로 요청합니다.</p>
          <p>로컬 fixture를 읽는 실제 서버 함수입니다. 표시 숫자는 이 응답의 서로 다른 ID 개수이며 전체 서버 실행 횟수·처리 속도·성능 점수가 아닙니다. DB·외부 API·인공지연은 없습니다.</p>
          <a href="https://react.dev/reference/react/cache" target="_blank" rel="noreferrer" className="inline-block text-violet-600 underline">React cache 공식 문서 ↗</a>
        </div>
      }
    />
  );
}
