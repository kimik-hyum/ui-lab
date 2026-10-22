'use client';

import { memo } from "react";
import { PREVIEW_ROWS } from "../constants";
import type { SlowPreviewProps } from "../types";
import { SlowPreviewRow } from "./SlowPreviewRow";

// [cmp:memo:start]
export const SlowPreviewList = memo(function SlowPreviewList({ text, workload }: SlowPreviewProps) {
  return (
    <ol data-preview-list className="m-0 list-none p-0">
      {PREVIEW_ROWS.map((number) => <SlowPreviewRow key={number} number={number} text={text} workload={workload} />)}
    </ol>
  );
});
// [cmp:memo:end]
