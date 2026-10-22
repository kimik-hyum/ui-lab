export type CacheItemId = "alpha" | "beta" | "error";

export interface CacheRecord {
  id: "alpha" | "beta";
  title: string;
  summary: string;
  taskCount: number;
}

export interface CacheDemoProps {
  item: CacheItemId;
  load: (item: CacheItemId, signal: AbortSignal) => Promise<CacheRecord>;
}
