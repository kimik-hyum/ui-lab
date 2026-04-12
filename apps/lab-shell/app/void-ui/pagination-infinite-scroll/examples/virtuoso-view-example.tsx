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
    <main className="min-h-screen bg-black px-5 py-10 text-white md:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-7 border-b border-zinc-800 pb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Void UI / Virtuoso Adapter Live</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Pagenation Infinify Scroll (Virtuoso)</h1>
          <p className="mt-2 text-sm text-zinc-400">
            기본 데모와 같은 컨트롤 레이아웃을 유지하면서 virtualization 어댑터를 주입한 예시입니다.
          </p>
        </header>

        <div className="sticky top-4 z-20 mb-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/90 px-2 py-2 text-xs backdrop-blur">
            <button
              type="button"
              onClick={() => handleMove(1)}
              disabled={isLoading || currentPage === 1}
              className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200 enabled:hover:border-cyan-400 enabled:hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              처음
            </button>
            <button
              type="button"
              onClick={() => {
                void handleGoToPrevious();
              }}
              disabled={isLoading || currentPage === 1}
              className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200 enabled:hover:border-cyan-400 enabled:hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전
            </button>
            <div className="inline-flex items-center gap-3 rounded-full bg-zinc-800/80 px-3 py-1.5">
              <span className="text-zinc-400">현재페이지</span>
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
                className="w-14 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-right font-semibold text-white focus:border-cyan-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="현재 페이지 입력"
              />
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400">전체페이지</span>
              <strong className="text-white">{totalPages}</strong>
            </div>
            <button
              type="button"
              onClick={() => handleMove(totalPages)}
              disabled={isLoading || currentPage === totalPages}
              className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200 enabled:hover:border-cyan-400 enabled:hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              마지막
            </button>
          </div>
        </div>

        <div className="h-[68vh] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60">
          <Virtuoso
            ref={virtuosoRef}
            data={flattenedProducts}
            rangeChanged={handleRangeChanged}
            itemContent={(index, product) => (
              <div key={product.id} className="border-b border-zinc-800/80 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      #{index + 1} {product.title}
                    </p>
                    <p className="mt-2 text-xs text-zinc-400">{product.description}</p>
                    <p className="mt-2 text-[11px] text-zinc-500">
                      {product.category} · rating {product.rating} · stock {product.stock}
                    </p>
                  </div>
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">${product.price}</span>
                </div>
              </div>
            )}
          />
        </div>

        <div className="py-8 text-center text-xs text-zinc-500">
          {isLoading
            ? "다음 페이지 로딩 중..."
            : canLoadMore
              ? "스크롤하면 다음 페이지를 불러옵니다."
              : "마지막 페이지입니다."}
        </div>
        {error ? (
          <p className="rounded-md border border-red-900 bg-red-950/30 px-3 py-2 text-xs text-red-300">{error}</p>
        ) : null}
      </div>
    </main>
  );
}
// [cmp:view-options:end]
