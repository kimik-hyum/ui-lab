'use client';

import { useMemo, useRef, useState } from "react";
import { ComparisonTemplate } from "../../components/ComparisonTemplate";
import { ComparisonTopicNotes } from "../../components/ComparisonTopicNotes";
import { collectAnchorLines, resolveTopicLines } from "../../components/codeAnchors";
import type { ComparisonTopic } from "../../components/ComparisonTypes";
import { createListItems, formatCount, getJumpOffset, LIST_COUNTS } from "./list-data";
import type { ListCount, ListDemoHandle } from "./types";
import { MapListDemo } from "./components/MapListDemo";
import { VirtuosoListDemo } from "./components/VirtuosoListDemo";
import styles from "./virtual-list.module.css";

const TOPICS = [
  { id: "rendering", title: "전체 행과 필요한 행", description: "map은 데이터 전체를 DOM으로 만듭니다. Virtuoso는 화면 주변에 필요한 행만 유지합니다. 같은 작업 목록을 보여주면서 DOM 규모를 줄이지만, 이것만으로 속도나 메모리 사용량을 판단할 수는 없습니다.", left: [30], right: [60, 61, 62] },
  { id: "viewport", title: "같은 높이로 비교", description: "양쪽은 같은 48px 행과 320px 스크롤 영역을 사용합니다. Virtuoso의 fixedItemHeight는 실제 행 높이를 알아 크기 측정을 생략합니다. 높이가 달라지는 목록에는 이 고정값을 그대로 쓰면 안 됩니다.", left: [24, 25, 26, 27, 28, 29], right: [49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59] },
  { id: "navigation", title: "같은 항목으로 이동", description: "map은 행 높이로 scrollTop을 계산하고, Virtuoso는 scrollToIndex로 이동합니다. 초기 배치 전 클릭도 마지막 이동 명령으로 보관하고, 목록이 준비되면 애니메이션 없이 적용합니다. 각 스크롤 위치는 부모 ref에 저장하므로 코드 탭을 오가도 유지되며, 항목 수를 바꾸면 양쪽 모두 처음부터 시작합니다.", left: [12, 13, 14, 15, 16, 17, 18, 19], right: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43] },
];

export function VirtualListClientPage({ mapCode, virtuosoCode, libraryVersion }: { mapCode: string; virtuosoCode: string; libraryVersion: string }) {
  const [count, setCount] = useState<ListCount>(1000);
  const items = useMemo(() => createListItems(count), [count]);
  const mapHandle = useRef<ListDemoHandle>(null);
  const virtuosoHandle = useRef<ListDemoHandle>(null);
  const mapScroll = useRef(0);
  const virtuosoScroll = useRef(0);
  const topics = useMemo<ComparisonTopic[]>(() => {
    const left = collectAnchorLines(mapCode);
    const right = collectAnchorLines(virtuosoCode);
    return TOPICS.map((topic) => ({
      id: topic.id, title: topic.title, description: <p>{topic.description}</p>,
      leftLines: resolveTopicLines([topic.id], left, topic.left),
      rightLines: resolveTopicLines([topic.id], right, topic.right),
    }));
  }, [mapCode, virtuosoCode]);

  function jumpTo(index: number) {
    // 코드 화면에서 누른 이동도 다음 UI 마운트 시 같은 위치로 복원합니다.
    mapScroll.current = getJumpOffset(index, count);
    virtuosoScroll.current = mapScroll.current;
    mapHandle.current?.jumpTo(index);
    virtuosoHandle.current?.jumpTo(index);
  }

  function changeCount(next: ListCount) {
    mapScroll.current = 0;
    virtuosoScroll.current = 0;
    setCount(next);
  }

  return (
    <ComparisonTemplate
      title="map vs Virtuoso · DOM에는 몇 행이 남을까요?"
      description="같은 목록을 스크롤하고 처음·중간·끝으로 이동해보세요. 오른쪽은 화면 주변의 행만 DOM에 남깁니다."
      leftTitle="React map · 전체 행" rightTitle={`react-virtuoso ${libraryVersion} · 가상 목록`}
      leftCode={mapCode} rightCode={virtuosoCode} topics={topics}
      headerActions={<div className={`${styles.controls} flex flex-wrap items-center gap-2 text-xs`}><label className="flex items-center gap-2 text-slate-600">항목 수<select aria-label="목록 항목 수" value={count} onChange={(event) => changeCount(Number(event.target.value) as ListCount)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-slate-700">{LIST_COUNTS.map((value) => <option key={value} value={value}>{formatCount(value)}개</option>)}</select></label><div className="flex flex-wrap gap-1" role="group" aria-label="양쪽 목록 위치 이동"><button onClick={() => jumpTo(0)} className="min-h-11 rounded-lg border border-slate-300 px-3 text-slate-600">처음</button><button onClick={() => jumpTo(Math.floor(count / 2))} className="min-h-11 rounded-lg border border-slate-300 px-3 text-slate-600">중간</button><button onClick={() => jumpTo(count - 1)} className="min-h-11 rounded-lg border border-slate-300 px-3 text-slate-600">끝</button></div></div>}
      leftComponent={<MapListDemo key={count} ref={mapHandle} items={items} savedScrollRef={mapScroll} />}
      rightComponent={<VirtuosoListDemo key={count} ref={virtuosoHandle} items={items} savedScrollRef={virtuosoScroll} />}
      footer={<div className="space-y-3 p-6 text-sm leading-relaxed text-slate-500"><p>동일 데이터 · 행 48px · 스크롤 영역 320px. 현재 DOM 행에는 화면 밖에 남겨둔 행도 포함됩니다.</p><p>관찰기는 목록 DOM이 바뀔 때 실제 행을 세며 별도 컴포넌트만 갱신합니다. 이 조회에도 비용이 있으므로 FPS·메모리·렌더 시간의 벤치마크로 사용하지 않습니다.</p><ComparisonTopicNotes topics={topics} /><a href="https://virtuoso.dev/react-virtuoso/api-reference/virtuoso/" target="_blank" rel="noreferrer" className="inline-block text-violet-600 underline">Virtuoso 공식 문서 ↗</a></div>}
    />
  );
}
