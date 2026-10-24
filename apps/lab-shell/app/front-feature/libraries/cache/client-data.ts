import type { CacheItemId, CacheRecord } from "./types";

export async function fetchCacheRecord(item: CacheItemId, signal: AbortSignal): Promise<CacheRecord> {
  const response = await fetch(`/api/cache-demo?item=${item}`, { cache: "no-store", signal });
  if (!response.ok) throw new Error(`요청 실패 (${response.status})`);
  const value: unknown = await response.json();
  if (!value || typeof value !== "object" || !("id" in value) || value.id !== item ||
      !("title" in value) || typeof value.title !== "string" ||
      !("summary" in value) || typeof value.summary !== "string" ||
      !("taskCount" in value) || typeof value.taskCount !== "number" || !Number.isInteger(value.taskCount) || value.taskCount < 0 ||
      (value.id !== "alpha" && value.id !== "beta")) {
    throw new Error("응답 형식이 올바르지 않습니다.");
  }
  return { id: value.id, title: value.title, summary: value.summary, taskCount: value.taskCount };
}
