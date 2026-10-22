'use client';

import { useEffect, useState } from "react";
import type { CacheDemoProps, CacheItemId, CacheRecord } from "../types";
import { CacheResult } from "./CacheResult";

type ManualResult = { item: CacheItemId; data?: CacheRecord; error?: string };

export function ManualFetchDemo({ item, load }: CacheDemoProps) {
  // [cmp:cache-reuse:start]
  const [result, setResult] = useState<ManualResult | null>(null);
  // 이 로컬 결과는 닫기·코드 전환으로 unmount되면 사라집니다.
  // [cmp:cache-reuse:end]
  useEffect(() => {
    // [cmp:cancellation:start]
    const controller = new AbortController();
    let active = true;
    void load(item, controller.signal).then(
      (data) => { if (active) setResult({ item, data }); },
      (error: unknown) => {
        if (active && !controller.signal.aborted) {
          setResult({ item, error: error instanceof Error ? error.message : "데이터를 불러오지 못했습니다." });
        }
      },
    );
    return () => { active = false; controller.abort(); };
    // [cmp:cancellation:end]
    // [cmp:cache-key:start]
  }, [item, load]);
  const current = result?.item === item ? result : undefined;
  // [cmp:cache-key:end]

  return <CacheResult data={current?.data} error={current?.error} />;
}
