'use client';

import type { RefObject } from "react";
import { formatCount } from "../list-data";
import { useRowObservation } from "../use-row-observation";

export function RowObservation({ root }: { root: RefObject<HTMLElement | null> }) {
  const observation = useRowObservation(root);
  return (
    <div className="mb-3 space-y-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="m-0 text-xs text-slate-500">현재 DOM 행</p>
      <output className="block text-2xl font-semibold tabular-nums text-slate-800" aria-label="실제 DOM 행 수" aria-live="off">
        {observation ? `${formatCount(observation.count)}개` : "관찰 준비 중"}
      </output>
      <p className="m-0 min-h-4 text-xs text-slate-500">
        {observation?.first != null && observation.last != null ? `DOM 범위 ${formatCount(observation.first)}–${formatCount(observation.last)}번` : "목록이 준비되면 실제 행을 셉니다."}
      </p>
    </div>
  );
}
