import type { PreviewWorkload } from "./types";

export const PREVIEW_ROW_COUNT = 120;
export const PREVIEW_ROWS = Array.from({ length: PREVIEW_ROW_COUNT }, (_, index) => index + 1);
export const MAX_TEXT_LENGTH = 80;
export const WORKLOAD_OPTIONS: readonly { value: PreviewWorkload; label: string }[] = [
  { value: "1.5", label: "느린 목록 · 행당 1.5ms 목표" },
  { value: "0", label: "일반 목록 · 인공 작업 없음" },
];
