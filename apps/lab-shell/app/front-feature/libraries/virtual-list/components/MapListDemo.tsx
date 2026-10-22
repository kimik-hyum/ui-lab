'use client';

import { useImperativeHandle, useLayoutEffect, useRef } from "react";
import { getJumpOffset } from "../list-data";
import type { ListDemoProps } from "../types";
import { ListRow } from "./ListRow";
import { RowObservation } from "./RowObservation";

export function MapListDemo({ items, savedScrollRef, ref }: ListDemoProps) {
  const viewport = useRef<HTMLDivElement>(null);

  // [cmp:navigation:start]
  useLayoutEffect(() => {
    if (viewport.current) viewport.current.scrollTop = savedScrollRef.current;
  }, [savedScrollRef]);
  useImperativeHandle(ref, () => ({
    jumpTo(index) {
      viewport.current?.scrollTo({ top: getJumpOffset(index, items.length), behavior: "instant" });
    },
  }), [items.length]);
  // [cmp:navigation:end]

  return (
    <article className="min-w-0" aria-label="전체 map 목록">
      <RowObservation root={viewport} />
      {/* [cmp:viewport:start] */}
      <div
        ref={viewport}
        role="list" aria-label="전체 map 작업 목록" tabIndex={0}
        className="h-[320px] overflow-auto rounded-lg ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-violet-600"
        onScroll={(event) => { savedScrollRef.current = event.currentTarget.scrollTop; }}
      >
        {/* [cmp:viewport:end] */}
        {/* [cmp:rendering:start] */}
        {items.map((item) => <ListRow key={item.id} item={item} total={items.length} />)}
        {/* [cmp:rendering:end] */}
      </div>
    </article>
  );
}
