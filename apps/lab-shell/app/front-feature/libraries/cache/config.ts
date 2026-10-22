import type { CacheItemId } from "./types";

export const CACHE_STALE_MS = 60_000;
export const CACHE_GC_MS = 300_000;
export const CACHE_DELAY_MS = 700;
export const CACHE_ITEMS: readonly { id: CacheItemId; label: string }[] = [
  { id: "alpha", label: "프로젝트 A" },
  { id: "beta", label: "프로젝트 B" },
  { id: "error", label: "오류 응답" },
];
