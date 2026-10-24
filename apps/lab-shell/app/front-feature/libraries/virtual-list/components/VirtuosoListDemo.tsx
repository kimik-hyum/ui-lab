'use client';

import { useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { Virtuoso } from "react-virtuoso";
import type { VirtuosoHandle } from "react-virtuoso";
import { getJumpOffset, ROW_HEIGHT } from "../list-data";
import type { ListDemoProps } from "../types";
import { ListRow } from "./ListRow";
import { RowObservation } from "./RowObservation";

export function VirtuosoListDemo({ items, savedScrollRef, ref }: ListDemoProps) {
  const root = useRef<HTMLDivElement>(null);
  const virtuoso = useRef<VirtuosoHandle>(null);

  // [cmp:navigation:start]
  const readyRef = useRef(false);
  const pendingOffsetRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const flushPending = useCallback(() => {
    if (!readyRef.current || pendingOffsetRef.current === null || frameRef.current) return;
    // itemsRendered 뒤 DOM이 반영되는 프레임에 가장 최근 명령 하나를 적용합니다.
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const top = pendingOffsetRef.current;
      if (top === null || !virtuoso.current) return;
      pendingOffsetRef.current = null;
      virtuoso.current.scrollToIndex({ index: Math.floor(top / ROW_HEIGHT), offset: top % ROW_HEIGHT, align: "start", behavior: "auto" });
    });
  }, []);
  const attachRoot = useCallback((element: HTMLDivElement | null) => {
    root.current = element;
    if (element && pendingOffsetRef.current === null) pendingOffsetRef.current = savedScrollRef.current;
    flushPending();
  }, [savedScrollRef, flushPending]);
  useEffect(() => {
    flushPending();
    return () => { cancelAnimationFrame(frameRef.current); frameRef.current = 0; };
  }, [flushPending]);
  useImperativeHandle(ref, () => ({
    jumpTo(index) {
      pendingOffsetRef.current = getJumpOffset(index, items.length);
      flushPending();
    },
  }), [items.length, flushPending]);
  // [cmp:navigation:end]

  return (
    <article className="min-w-0" aria-label="Virtuoso 가상 목록">
      <RowObservation root={root} />
      <div ref={attachRoot} className="h-[320px]">
        {/* [cmp:viewport:start] */}
        <Virtuoso
          ref={virtuoso}
          className="h-[320px] rounded-lg ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-violet-600"
          role="list" aria-label="Virtuoso 작업 목록" tabIndex={0}
          fixedItemHeight={ROW_HEIGHT}
          itemsRendered={(rendered) => {
            if (rendered.length > 0) { readyRef.current = true; flushPending(); }
          }}
          onScroll={(event) => {
            if (pendingOffsetRef.current === null) savedScrollRef.current = event.currentTarget.scrollTop;
          }}
          // [cmp:viewport:end]
          // [cmp:rendering:start]
          data={items}
          computeItemKey={(_, item) => item.id}
          itemContent={(_, item) => <ListRow item={item} total={items.length} />}
          // [cmp:rendering:end]
        />
      </div>
    </article>
  );
}
