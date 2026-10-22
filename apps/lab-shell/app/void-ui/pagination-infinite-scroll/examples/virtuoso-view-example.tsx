'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Virtuoso, VirtuosoHandle, ListRange } from "react-virtuoso";
import { useHybridInfinite } from "../useHybridInfinite";
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
    goToPage,
    ensurePageLoaded,
    isPageLoaded,
    scrollToPage,
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

  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const flattenedProducts = useMemo(() => pages.flatMap((pageItem) => pageItem.items), [pages]);

  useEffect(() => {
    totalCountRef.current = flattenedProducts.length;
  }, [flattenedProducts.length]);

  useLayoutEffect(() => {
    firstLoadedPageRef.current = pages[0]?.page ?? 1;
  }, [pages]);

  const handleRangeChanged = useCallback(
    (range: ListRange) => {
      adapter?.onRangeChanged(range);
    },
    [adapter],
  );

  const handleMove = useCallback(
    (page: number) => {
      if (isLoading || page < 1 || page > totalPages) return;
      if (page === currentPage) return;
      void goToPage(page);
    },
    [currentPage, goToPage, isLoading, totalPages],
  );

  const handleInputMove = useCallback(() => {
    const parsed = Number(pageInput);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > totalPages) {
      setPageInput(String(currentPage));
      return;
    }
    handleMove(parsed);
  }, [currentPage, handleMove, pageInput, totalPages]);

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
      <div className="w-full min-w-0">
        <header className="mb-7 border-b border-border pb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent">Void UI / Virtuoso Adapter Live</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Pagination + Infinite Scroll (Virtuoso)</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            화면에 보이는 항목만 렌더링하는 가상화 목록에서 페이지 이동과 연속 탐색을 확인합니다.
          </p>
        </header>

        <div className="sticky top-[calc(var(--shell-header-height)+12px)] z-20 mb-7">
          <nav aria-label="상품 목록 페이지 이동" className="flex max-w-full flex-wrap items-center gap-2 rounded-xl border border-border bg-white/95 p-3 text-xs shadow-sm backdrop-blur sm:w-fit">
            <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-lg bg-surface px-3 py-2 sm:w-auto">
              <span className="text-muted-foreground">페이지</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                step={1}
                inputMode="numeric"
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value)}
                onBlur={handleInputMove}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.currentTarget.blur();
                }}
                disabled={isLoading}
                className="min-h-9 w-16 rounded-md border border-border bg-white px-2 py-1 text-right font-mono font-medium text-foreground focus:border-accent disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="현재 페이지 입력"
              />
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">전체</span>
              <strong className="text-foreground">{totalPages}</strong>

            </div>
            <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
              <button
              type="button"
              onClick={() => handleMove(1)}
              disabled={isLoading || currentPage === 1}
              className="min-h-10 rounded-lg border border-border bg-white px-4 py-2 text-foreground transition-colors enabled:hover:border-accent/40 enabled:hover:bg-accent-subtle enabled:hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              처음
            </button>
              <button
              type="button"
              onClick={() => {
                void handleGoToPrevious();
              }}
              disabled={isLoading || currentPage === 1}
              className="min-h-10 rounded-lg border border-border bg-white px-4 py-2 text-foreground transition-colors enabled:hover:border-accent/40 enabled:hover:bg-accent-subtle enabled:hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전
            </button>
              <button
              type="button"
              onClick={() => handleMove(totalPages)}
              disabled={isLoading || currentPage === totalPages}
              className="min-h-10 rounded-lg border border-border bg-white px-4 py-2 text-foreground transition-colors enabled:hover:border-accent/40 enabled:hover:bg-accent-subtle enabled:hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              마지막
            </button>
            </div>
          </nav>
        </div>

        <div className="h-[65dvh] min-h-[320px] overflow-hidden rounded-xl border border-border bg-white">
          <Virtuoso
            ref={virtuosoRef}
            data={flattenedProducts}
            rangeChanged={handleRangeChanged}
            itemContent={(index, product) => (
              <div key={product.id} className="border-b border-border px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      #{index + 1} {product.title}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{product.description}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {product.category} · rating {product.rating} · stock {product.stock}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-accent-subtle px-2 py-1 font-mono text-xs text-accent">${product.price}</span>
                </div>
              </div>
            )}
          />
        </div>

        <div className="py-8 text-center text-xs text-muted-foreground">
          {isLoading
            ? "다음 페이지 로딩 중..."
            : canLoadMore
              ? "스크롤하면 다음 페이지를 불러옵니다."
              : "마지막 페이지입니다."}
        </div>
        {error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs leading-6 text-red-700">{error}</p>
        ) : null}
      </div>
    </main>
  );
}
// [cmp:view-options:end]
