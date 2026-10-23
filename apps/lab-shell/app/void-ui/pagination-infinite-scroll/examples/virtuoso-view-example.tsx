'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Virtuoso, VirtuosoHandle, ListRange } from "react-virtuoso";
import { useHybridInfinite } from "../useHybridInfinite";
import { PreviousContentControl } from "../PreviousContentControl";
import { PageNumberInput } from "../PageNumberInput";
import { focusPageNavigationCommand } from "../page-navigation-events";
import { createVirtuosoAdapter, VirtuosoHybridAdapter } from "./virtuoso-adapter-example";

type Product = {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  stock: number;
};

type ProductsResponse = {
  products: Product[];
  total: number;
};

// [cmp:view-options:start]
export function VirtuosoViewExample({
  initialPage,
  initialProducts,
  initialTotal,
  pageSize,
}: {
  initialPage: number;
  initialProducts: Product[];
  initialTotal: number;
  pageSize: number;
}) {
  const virtuosoRef = useRef<VirtuosoHandle | null>(null);
  const totalCountRef = useRef(initialProducts.length);
  const firstLoadedPageRef = useRef(initialPage);
  const [adapter, setAdapter] = useState<VirtuosoHybridAdapter | null>(null);

  useEffect(() => {
    const createdAdapter = createVirtuosoAdapter({
      pageSize,
      getTotalCount: () => totalCountRef.current,
      getFirstLoadedPage: () => firstLoadedPageRef.current,
      scrollToIndex: ({ index, behavior }) => {
        virtuosoRef.current?.scrollToIndex({
          index,
          align: "start",
          behavior: behavior ?? "smooth",
        });
      },
      loadMoreThreshold: 8,
    });

    setAdapter(createdAdapter);
  }, [pageSize]);

  const fetchPage = useCallback(
    async ({
      page,
      pageSize: limit,
      signal,
    }: {
      page: number;
      pageSize: number;
      signal?: AbortSignal;
    }) => {
      const skip = (page - 1) * limit;
      const response = await fetch(`https://dummyjson.com/products?limit=${limit}&skip=${skip}`, { signal });
      if (!response.ok) {
        throw new Error("상품 데이터를 불러오지 못했습니다.");
      }

      const data = (await response.json()) as ProductsResponse;
      return { items: data.products, total: data.total };
    },
    [],
  );

  const {
    pages,
    currentPage,
    totalPages,
    isLoading,
    error,
    canLoadMore,
    canLoadPrevious,
    previousAutoEnabled,
    enablePrevious,
    listVersion,
    goToPage,
    ensurePageLoaded,
    isPageLoaded,
    scrollToPage,
    retry,
  } = useHybridInfinite<Product>({
    initialPage: { page: initialPage, items: initialProducts },
    initialTotal,
    pageSize,
    fetchPage,
    syncUrl: true,
    restoreFromUrl: true,
    pageParamKey: "p",
    preserveExistingParams: true,
    adapter: adapter ?? undefined,
  });


  const flattenedProducts = useMemo(() => pages.flatMap((pageItem) => pageItem.items), [pages]);
  const firstLoadedPage = pages[0]?.page ?? 1;

  const syncAdapterBounds = useCallback(() => {
    totalCountRef.current = flattenedProducts.length;
    firstLoadedPageRef.current = firstLoadedPage;
  }, [firstLoadedPage, flattenedProducts.length]);

  useLayoutEffect(syncAdapterBounds, [syncAdapterBounds]);

  const handleRangeChanged = useCallback(
    (range: ListRange) => {
      // 자식의 범위 이벤트가 부모 layoutEffect보다 먼저 와도 현재 목록을 기준으로 계산합니다.
      syncAdapterBounds();
      adapter?.onRangeChanged(range);
    },
    [adapter, syncAdapterBounds],
  );

  const handleMove = useCallback(
    (page: number) => {
      if (isLoading || page < 1 || page > totalPages) return;
      if (page === currentPage) return;
      void goToPage(page);
    },
    [currentPage, goToPage, isLoading, totalPages],
  );


  const handleGoToPrevious = useCallback(async () => {
    if (isLoading || currentPage <= 1) return;

    const targetPage = currentPage - 1;
    if (isPageLoaded(targetPage)) {
      scrollToPage(targetPage);
      return;
    }

    const loaded = await ensurePageLoaded(targetPage);
    if (!loaded) return;

    window.requestAnimationFrame(() => {
      scrollToPage(targetPage);
    });
  }, [currentPage, ensurePageLoaded, isLoading, isPageLoaded, scrollToPage]);

  return (
    <main className="workspace-page text-foreground">
      <div className="min-w-0">
        <header data-infinite-heading className="mb-7 border-b border-border pb-6">
          <p className="text-[11px] tracking-wide text-primary">실험실 · 가상 목록</p>
          <h1 className="mt-3 break-keep text-3xl font-semibold tracking-tight">무한 스크롤 · Virtuoso (가상화)</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            목록 안을 스크롤해 상품을 더 보세요. 화면 주변의 항목만 렌더링하며, 페이지 번호로도 이동할 수 있습니다.
          </p>
        </header>

        <div className="sticky top-20 z-20 mb-7">
          <div data-page-navigation role="group" aria-label="페이지 이동" onPointerDownCapture={focusPageNavigationCommand} className="flex w-fit max-w-full flex-wrap items-center gap-2 rounded-xl border border-border bg-card/95 p-2 text-xs backdrop-blur">
            <button
              type="button"
              data-page-command="first"
              onClick={() => handleMove(1)}
              disabled={isLoading || currentPage === 1}
              className="min-h-11 min-w-11 rounded-lg border border-border px-3 py-2 text-foreground enabled:hover:border-primary enabled:hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              처음
            </button>
            <button
              type="button"
              data-page-command="previous"
              onClick={() => {
                void handleGoToPrevious();
              }}
              disabled={isLoading || currentPage === 1}
              className="min-h-11 min-w-11 rounded-lg border border-border px-3 py-2 text-foreground enabled:hover:border-primary enabled:hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전
            </button>
            <div className="order-first inline-flex min-w-0 w-full flex-wrap items-center justify-center gap-2 rounded-xl bg-surface-elevated px-3 py-1 sm:order-none sm:w-auto [&_input]:min-h-11">
              <span className="text-muted-foreground">페이지</span>
              <PageNumberInput
                key={currentPage}
                currentPage={currentPage}
                totalPages={totalPages}
                isLoading={isLoading}
                onNavigate={handleMove}
              />
              <span aria-hidden="true" className="text-muted-foreground">/</span>
              <strong className="text-foreground"><span className="sr-only">전체 </span>{totalPages}</strong>
            </div>
            <button
              type="button"
              data-page-command="last"
              onClick={() => handleMove(totalPages)}
              disabled={isLoading || currentPage === totalPages}
              className="min-h-11 min-w-11 rounded-lg border border-border px-3 py-2 text-foreground enabled:hover:border-primary enabled:hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              마지막
            </button>
          </div>
          {error && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-red-200 bg-card/95 px-3 py-2 text-xs backdrop-blur">
              <p role="alert" className="min-w-0 flex-1 break-words text-red-700">{error}</p>
              <button type="button" disabled={isLoading} onClick={() => { void retry(); }} className="min-h-11 shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-foreground enabled:hover:border-primary enabled:hover:text-primary disabled:cursor-not-allowed disabled:opacity-40">다시 불러오기</button>
            </div>
          )}
        </div>

        <PreviousContentControl canLoadPrevious={canLoadPrevious} autoEnabled={previousAutoEnabled} isLoading={isLoading} hasError={Boolean(error)} onLoad={enablePrevious} />
        <div data-first-loaded-page={firstLoadedPage} className="h-[68vh] min-w-0 overflow-hidden rounded-xl border border-border bg-card">
          <Virtuoso
            key={listVersion}
            ref={virtuosoRef}
            firstItemIndex={(firstLoadedPage - 1) * pageSize + 1}
            computeItemKey={(_, product) => product.id}
            onScroll={(event) => { adapter?.onScroll(event.currentTarget.scrollTop); }}
            data={flattenedProducts}
            rangeChanged={handleRangeChanged}
            itemContent={(index, product) => (
              <div data-product-id={product.id} key={product.id} className="min-w-0 border-b border-border px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-foreground">
                      #{index} {product.title}
                    </p>
                    <p className="mt-2 break-words text-xs text-muted-foreground">{product.description}</p>
                    <p className="mt-2 break-words text-[11px] text-muted-foreground">
                      {product.category} · rating {product.rating} · stock {product.stock}
                    </p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700">${product.price}</span>
                </div>
              </div>
            )}
          />
        </div>

        <div className="py-6 text-center text-xs text-muted-foreground">
          {!error && (
            <p role="status" aria-live="polite" aria-atomic="true">
              {isLoading ? "상품을 불러오는 중…" : canLoadMore ? "목록 안을 스크롤하면 다음 페이지를 불러옵니다." : "마지막 페이지입니다."}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
// [cmp:view-options:end]
