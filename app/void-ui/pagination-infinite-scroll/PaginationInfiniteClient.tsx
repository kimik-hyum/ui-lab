'use client';

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useHybridInfinite } from "./useHybridInfinite";

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
  skip: number;
  limit: number;
};

interface PaginationInfiniteClientProps {
  initialPage: number;
  initialProducts: Product[];
  initialTotal: number;
  pageSize: number;
  syncUrl?: boolean;
  restoreFromUrl?: boolean;
  pageParamKey?: string;
  preserveExistingParams?: boolean;
}

export function PaginationInfiniteClient({
  initialPage,
  initialProducts,
  initialTotal,
  pageSize,
  syncUrl = true,
  restoreFromUrl = true,
  pageParamKey = "page",
  preserveExistingParams = true,
}: PaginationInfiniteClientProps) {
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
      return {
        items: data.products,
        total: data.total,
      };
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
    setPageRef,
    setSentinelRef,
    goToPage,
    ensurePageLoaded,
    isPageLoaded,
    scrollToPage,
  } = useHybridInfinite<Product>({
    initialPage: { page: initialPage, items: initialProducts },
    initialTotal,
    pageSize,
    fetchPage,
    syncUrl,
    restoreFromUrl,
    pageParamKey,
    historyMode: "replace",
    pageObserverRootMargin: "-8% 0px -52% 0px",
    loadMoreRootMargin: "0px 0px 420px 0px",
    preserveExistingParams,
  });
  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handleGoToFirst = useCallback(() => {
    if (isLoading || currentPage === 1) return;
    void goToPage(1);
  }, [currentPage, goToPage, isLoading]);

  const handleGoToLast = useCallback(() => {
    if (isLoading || currentPage === totalPages) return;
    void goToPage(totalPages);
  }, [currentPage, goToPage, isLoading, totalPages]);

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

  const handlePageInputMove = useCallback(async () => {
    const parsed = Number(pageInput);

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > totalPages) {
      setPageInput(String(currentPage));
      return;
    }

    if (parsed === currentPage || isLoading) return;
    void goToPage(parsed);
  }, [currentPage, goToPage, isLoading, pageInput, totalPages]);

  return (
    <main className="min-h-screen bg-black px-5 py-10 text-white md:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-7 border-b border-zinc-800 pb-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Void UI / Hybrid Navigation</p>
            <div className="flex items-center gap-2">
              <Link
                href="/void-ui/pagination-infinite-scroll/adapter-live"
                className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] text-zinc-300 transition-colors hover:border-cyan-400 hover:text-cyan-200"
              >
                Virtuoso 실행 데모
              </Link>
              <Link
                href="/void-ui/pagination-infinite-scroll/adapter-view"
                className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] text-zinc-300 transition-colors hover:border-cyan-400 hover:text-cyan-200"
              >
                Adapter 뷰 예시
              </Link>
              <Link
                href="/void-ui/pagination-infinite-scroll/hook"
                className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] text-zinc-300 transition-colors hover:border-cyan-400 hover:text-cyan-200"
              >
                Hook 코드 해설
              </Link>
            </div>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Pagenation Infinify Scroll</h1>
          <p className="mt-2 text-sm text-zinc-400">
            훅은 headless로 유지하고, 현재 화면은 데모 전용 스타일 레이어만 적용한 상태입니다.
          </p>
        </header>

        <div className="sticky top-4 z-20 mb-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/90 px-2 py-2 text-xs backdrop-blur">
            <button
              type="button"
              onClick={handleGoToFirst}
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
                onBlur={() => {
                  handlePageInputMove();
                }}
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
              onClick={handleGoToLast}
              disabled={isLoading || currentPage === totalPages}
              className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200 enabled:hover:border-cyan-400 enabled:hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              마지막
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {pages.map((pageItem) => (
            <section
              key={pageItem.page}
              data-page={pageItem.page}
              ref={(node) => setPageRef(pageItem.page, node)}
              className="scroll-mt-24 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5"
            >
              <h2 className="mb-4 text-sm font-semibold tracking-wide text-cyan-300">PAGE {pageItem.page}</h2>
              <ul className="space-y-3">
                {pageItem.items.map((product) => (
                  <li key={product.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-medium text-zinc-100">{product.title}</h3>
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                        ${product.price}
                      </span>
                    </div>
                    <p className="mt-2 max-h-10 overflow-hidden text-xs text-zinc-400">{product.description}</p>
                    <p className="mt-2 text-[11px] text-zinc-500">
                      {product.category} · rating {product.rating} · stock {product.stock}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div ref={setSentinelRef} className="py-8 text-center text-xs text-zinc-500">
          {isLoading
            ? "다음 페이지 로딩 중..."
            : canLoadMore
              ? "스크롤하면 다음 페이지를 불러옵니다."
              : "마지막 페이지입니다."}
        </div>

        {error ? (
          <p className="rounded-md border border-red-900 bg-red-950/30 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
