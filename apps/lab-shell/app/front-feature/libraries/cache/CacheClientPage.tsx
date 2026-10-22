'use client';

import { useCallback, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ComparisonTemplate } from "../../components/ComparisonTemplate";
import { ComparisonTopicNotes } from "../../components/ComparisonTopicNotes";
import { collectAnchorLines, resolveTopicLines } from "../../components/codeAnchors";
import type { ComparisonTopic } from "../../components/ComparisonTypes";
import { fetchCacheRecord } from "./client-data";
import { CACHE_DELAY_MS, CACHE_GC_MS, CACHE_ITEMS, CACHE_STALE_MS } from "./config";
import type { CacheItemId } from "./types";
import { CachePanel } from "./components/CachePanel";
import { ManualFetchDemo } from "./components/ManualFetchDemo";
import { QueryCacheDemo } from "./components/QueryCacheDemo";
import styles from "./cache.module.css";

const TOPICS = [
  { id: "cache-reuse", title: "다시 열 때 캐시 재사용", description: "왼쪽의 로컬 결과는 닫으면 사라져 다시 요청합니다. 오른쪽은 페이지의 QueryClient에 성공 데이터를 보관하며, 같은 항목을 60초 안에 다시 열면 요청 없이 재사용합니다. 재요청 정책을 직접 관리하는 코드를 줄입니다.", left: [10, 11], right: [12, 13, 14, 15, 16] },
  { id: "cache-key", title: "항목별로 결과 분리", description: "왼쪽은 항목 변경 때 다시 요청하고 이전 항목의 결과를 가립니다. 오른쪽은 queryKey에 항목 ID를 넣어 프로젝트별 데이터를 따로 저장합니다. 항목을 오갈 때 다른 데이터가 섞이는 것을 막습니다.", left: [24, 25], right: [10] },
  { id: "cancellation", title: "닫거나 바꾸면 요청 취소", description: "왼쪽은 AbortController와 active 가드로 취소·늦은 응답을 직접 관리합니다. 오른쪽은 Query가 제공하는 signal을 fetch에 전달합니다. 양쪽 모두 사용하지 않는 요청을 중단하고 지난 결과가 새 화면을 덮지 않도록 합니다.", left: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], right: [11] },
];

export function CacheClientPage({ manualCode, queryCode, libraryVersion }: { manualCode: string; queryCode: string; libraryVersion: string }) {
  const [queryClient] = useState(() => new QueryClient());
  const [item, setItem] = useState<CacheItemId>("alpha");
  const [open, setOpen] = useState(false);
  const [attempts, setAttempts] = useState({ manual: 0, query: 0 });
  const loadManual = useCallback((id: CacheItemId, signal: AbortSignal) => {
    setAttempts((value) => ({ ...value, manual: value.manual + 1 }));
    return fetchCacheRecord(id, signal);
  }, []);
  const loadQuery = useCallback((id: CacheItemId, signal: AbortSignal) => {
    setAttempts((value) => ({ ...value, query: value.query + 1 }));
    return fetchCacheRecord(id, signal);
  }, []);
  const topics = useMemo<ComparisonTopic[]>(() => {
    const left = collectAnchorLines(manualCode);
    const right = collectAnchorLines(queryCode);
    return TOPICS.map((topic) => ({
      id: topic.id, title: topic.title, description: <p>{topic.description}</p>,
      leftLines: resolveTopicLines([topic.id], left, topic.left),
      rightLines: resolveTopicLines([topic.id], right, topic.right),
    }));
  }, [manualCode, queryCode]);

  function reset() {
    if (open) return;
    queryClient.clear();
    setAttempts({ manual: 0, query: 0 });
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ComparisonTemplate
        title="fetch vs Query · 다시 열면 또 요청할까요?"
        description="데이터를 받은 뒤 닫고 다시 열어보세요. 같은 항목의 요청 시도가 어떻게 달라지는지 확인합니다."
        leftTitle="React fetch · 매번 요청" rightTitle={`TanStack Query ${libraryVersion} · 항목별 캐시`}
        leftCode={manualCode} rightCode={queryCode} topics={topics}
        headerActions={<div className={`${styles.controls} flex flex-wrap items-center gap-2 text-xs`}><label className="flex items-center gap-2 text-slate-600">항목<select aria-label="캐시 비교 항목" value={item} onChange={(event) => setItem(event.target.value as CacheItemId)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-slate-700">{CACHE_ITEMS.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label><button onClick={() => setOpen((value) => !value)} className="min-h-11 rounded-lg bg-violet-600 px-4 text-white">{open ? "닫기" : "열기"}</button><button onClick={reset} disabled={open} className="min-h-11 rounded-lg border border-slate-300 px-3 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40" title={open ? "닫은 뒤 초기화할 수 있습니다." : "캐시와 요청 시도 수 초기화"}>초기화</button></div>}
        leftComponent={<CachePanel open={open} attempts={attempts.manual}><ManualFetchDemo key={item} item={item} load={loadManual} /></CachePanel>}
        rightComponent={<CachePanel open={open} attempts={attempts.query}><QueryCacheDemo key={item} item={item} load={loadQuery} /></CachePanel>}
        footer={<div className="space-y-3 p-6 text-sm leading-relaxed text-slate-500"><p>동일 API · HTTP 캐시 없음 · 시연 지연 {CACHE_DELAY_MS}ms · fresh {CACHE_STALE_MS / 1000}초 · 미사용 캐시 보관 {CACHE_GC_MS / 60000}분. 60초 이후 다시 열면 저장값을 먼저 보여주고 갱신합니다. 창 포커스·재연결 재요청과 자동 재시도는 껐습니다.</p><p>요청 시도는 fetch를 시작한 횟수로 취소도 포함합니다. 속도 측정값이 아닙니다. 로딩 중 닫거나 항목을 바꿔 취소를 확인하고, 오류는 닫고 다시 열어 재시도할 수 있습니다.</p><p>열린 상태의 코드 → UI 전환도 데모를 다시 마운트합니다. 수동 fetch는 다시 요청하며 Query 캐시는 유지됩니다. 개발 모드의 Effect 재실행도 요청 시도에 포함됩니다.</p><ComparisonTopicNotes topics={topics} /><a href="https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults" target="_blank" rel="noreferrer" className="inline-block text-violet-600 underline">Query 캐시 정책 문서 ↗</a></div>}
      />
    </QueryClientProvider>
  );
}
