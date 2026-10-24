"use client";

import { RequestFrame } from "./RequestFrame";

export function SequentialDemo({ delayMs, run }: { delayMs: number; run: number }) {
  return <RequestFrame key={`${delayMs}-${run}`} mode="sequential" delayMs={delayMs} run={run} />;
}
