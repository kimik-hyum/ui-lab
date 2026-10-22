'use client';

import { runPreviewWork } from "../preview-workload";
import type { SlowPreviewProps } from "../types";

export function SlowPreviewRow({ number, text, workload }: SlowPreviewProps & { number: number }) {
  runPreviewWork(text, workload);

  return (
    <li data-preview-row={number} className="flex h-12 min-w-0 items-center gap-3 border-b border-slate-200 px-3 last:border-b-0">
      <span className="shrink-0 text-xs tabular-nums text-slate-500">{String(number).padStart(3, "0")}</span>
      <span className="min-w-0 truncate text-sm text-slate-700">{text || "문구를 입력하면 이 행에 반영됩니다."}</span>
    </li>
  );
}
