'use client';

import { memo, useDeferredValue, useId } from "react";
import { MAX_TEXT_LENGTH } from "../constants";
import type { PreviewDemoProps } from "../types";
import { SlowPreviewList } from "./SlowPreviewList";

export const DeferredPreview = memo(function DeferredPreview({ text, onTextChange, workload }: PreviewDemoProps) {
  const inputId = useId();
  // [cmp:priority:start]
  const deferredText = useDeferredValue(text);
  // [cmp:priority:end]
  // [cmp:stale:start]
  const isStale = text !== deferredText;
  // [cmp:stale:end]

  return (
    <article data-deferred-side="deferred" data-preview-stale={isStale} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
      {/* [cmp:input:start] */}
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-slate-700">입력 문구</label>
      <input id={inputId} aria-label="지연 반영 입력 문구" value={text} onChange={(event) => onTextChange(event.target.value)} maxLength={MAX_TEXT_LENGTH} placeholder="같은 문구를 연속해서 입력해보세요" className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800" />
      {/* [cmp:input:end] */}
      <dl className="my-4 space-y-2 text-xs">
        <div><dt className="text-slate-500">입력값</dt><dd data-preview-input-value className="mt-1 break-all font-medium text-slate-800">{text || "(비어 있음)"}</dd></div>
        <div><dt className="text-slate-500">목록 기준값</dt><dd data-preview-list-value className="mt-1 break-all font-medium text-slate-800">{deferredText || "(비어 있음)"}</dd></div>
      </dl>
      {/* [cmp:stale:start] */}
      <p data-preview-status className={`mb-3 text-xs ${isStale ? "font-medium text-amber-600" : "text-slate-500"}`}>{isStale ? "목록 갱신 중 · 이전 문구 표시" : "입력과 목록 일치"}</p>
      {/* [cmp:stale:end] */}
      {/* [cmp:priority:start] */}
      <div role="region" aria-label="지연 반영 목록 · 120행" aria-busy={isStale} tabIndex={0} className={`h-80 overflow-y-auto rounded-lg border border-slate-200 focus-visible:outline-2 focus-visible:outline-violet-600 ${isStale ? "bg-amber-50" : "bg-slate-50"}`}>
        <SlowPreviewList text={deferredText} workload={workload} />
      </div>
      {/* [cmp:priority:end] */}
    </article>
  );
});
