import type { CacheRecord } from "./types";

export const CACHE_RECORDS: Record<CacheRecord["id"], CacheRecord> = {
  alpha: { id: "alpha", title: "프로젝트 A", summary: "새 화면의 접근성과 반응형 구성을 다듬습니다.", taskCount: 12 },
  beta: { id: "beta", title: "프로젝트 B", summary: "데이터 요청 흐름과 오류 화면을 정리합니다.", taskCount: 8 },
};
