'use client';

import { useQuery } from "@tanstack/react-query";
import { CACHE_GC_MS, CACHE_STALE_MS } from "../config";
import type { CacheDemoProps } from "../types";
import { CacheResult } from "./CacheResult";

export function QueryCacheDemo({ item, load }: CacheDemoProps) {
  const query = useQuery({
    // [cmp:cache-key:start]
    queryKey: ["cache-demo", item],
    // [cmp:cache-key:end]
    // [cmp:cancellation:start]
    queryFn: ({ signal }) => load(item, signal),
    // [cmp:cancellation:end]
    // [cmp:cache-reuse:start]
    staleTime: CACHE_STALE_MS,
    gcTime: CACHE_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    // [cmp:cache-reuse:end]
  });

  return <CacheResult data={query.data} error={query.error?.message} refreshing={query.isFetching} />;
}
