"use client";

import { RequestFrame } from "./RequestFrame";

export function ParallelDemo({ delayMs, run }: { delayMs: number; run: number }) {
  return <RequestFrame key={`${delayMs}-${run}`} mode="parallel" delayMs={delayMs} run={run} />;
}
