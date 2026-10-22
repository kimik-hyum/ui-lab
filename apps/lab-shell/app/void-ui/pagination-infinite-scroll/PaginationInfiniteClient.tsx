'use client';

import Link from "next/link";
import { useCallback } from "react";
import { PreviousContentControl } from "./PreviousContentControl";
import { PageNumberInput } from "./PageNumberInput";
import { focusPageNavigationCommand } from "./page-navigation-events";
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
    canLoadPrevious,
    previousAutoEnabled,
    enablePrevious,
    setPreviousSentinelRef,
    setPageRef,
    setSentinelRef,
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
    syncUrl,
    restoreFromUrl,
    pageParamKey,
    historyMode: "replace",
    pageObserverRootMargin: "-8% 0px -52% 0px",
    loadMoreRootMargin: "0px 0px 420px 0px",
    preserveExistingParams,
  });

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


  return (
    // Include the loading footer: otherwise the browser anchors to it and follows every append.
    <main className="min-h-screen bg-black px-5 py-10 text-white [overflow-anchor:none] md:px-10">
      <div className="mx-auto min-w-0 max-w-4xl">
        <header data-infinite-heading className="mb-7 border-b border-zinc-800 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] tracking-wide text-cyan-300">실험실 · 일반 목록</p>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/void-ui/pagination-infinite-scroll/adapter-live"
                className="inline-flex min-h-11 items-center rounded-full border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition-colors hover:border-cyan-400 hover:text-cyan-200"
              >
                Virtuoso 목록
              </Link>
              <Link
                href="/void-ui/pagination-infinite-scroll/adapter-view"
                className="inline-flex min-h-11 items-center rounded-full border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition-colors hover:border-cyan-400 hover:text-cyan-200"
              >
                어댑터 코드
              </Link>
              <Link
                href="/void-ui/pagination-infinite-scroll/hook"
                className="inline-flex min-h-11 items-center rounded-full border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition-colors hover:border-cyan-400 hover:text-cyan-200"
              >
                훅 해설
              </Link>
            </div>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">무한 스크롤</h1>
          <p className="mt-2 text-sm text-zinc-400">
            아래로 스크롤해 상품을 더 보고, 페이지 번호를 입력해 원하는 위치로 이동하세요.
          </p>
        </header>

        <div className="sticky top-4 z-20 mb-7">
          <div data-page-navigation role="group" aria-label="페이지 이동" onPointerDownCapture={focusPageNavigationCommand} className="flex w-fit max-w-full flex-wrap items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/90 p-2 text-xs backdrop-blur">
            <button
              type="button"
              data-page-command="first"
              onClick={handleGoToFirst}
              disabled={isLoading || currentPage === 1}
              className="min-h-11 min-w-11 rounded-full border border-zinc-700 px-3 py-2 text-zinc-200 enabled:hover:border-cyan-400 enabled:hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
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
              className="min-h-11 min-w-11 rounded-full border border-zinc-700 px-3 py-2 text-zinc-200 enabled:hover:border-cyan-400 enabled:hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전
            </button>

            <div className="order-first inline-flex min-w-0 w-full flex-wrap items-center justify-center gap-2 rounded-xl bg-zinc-800/80 px-3 py-1 sm:order-none sm:w-auto [&_input]:min-h-11">
              <span className="text-zinc-400">페이지</span>
              <PageNumberInput
                key={currentPage}
                currentPage={currentPage}
                totalPages={totalPages}
                isLoading={isLoading}
                onNavigate={(page) => { void goToPage(page); }}
              />
              <span aria-hidden="true" className="text-zinc-600">/</span>
              <strong className="text-white"><span className="sr-only">전체 </span>{totalPages}</strong>
            </div>

            <button
              type="button"
              data-page-command="last"
              onClick={handleGoToLast}
              disabled={isLoading || currentPage === totalPages}
              className="min-h-11 min-w-11 rounded-full border border-zinc-700 px-3 py-2 text-zinc-200 enabled:hover:border-cyan-400 enabled:hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              마지막
            </button>
          </div>
          {error && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-red-900 bg-zinc-900/90 px-3 py-2 text-xs backdrop-blur">
              <p role="alert" className="min-w-0 flex-1 break-words text-red-300">{error}</p>
              <button type="button" disabled={isLoading} onClick={() => { void retry(); }} className="min-h-11 shrink-0 rounded-full border border-zinc-700 px-3 py-2 text-sm text-zinc-200 enabled:hover:border-cyan-400 enabled:hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40">다시 불러오기</button>
            </div>
          )}
        </div>

        <div ref={setPreviousSentinelRef}>
          <PreviousContentControl canLoadPrevious={canLoadPrevious} autoEnabled={previousAutoEnabled} isLoading={isLoading} hasError={Boolean(error)} onLoad={enablePrevious} />
        </div>
        <div className="space-y-6">
          {pages.map((pageItem) => (
            <section
              key={pageItem.page}
              data-page={pageItem.page}
              ref={(node) => setPageRef(pageItem.page, node)}
              className="min-w-0 scroll-mt-40 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:scroll-mt-24 sm:p-5"
            >
              <h2 className="mb-4 text-sm font-semibold tracking-wide text-cyan-300">{pageItem.page}페이지</h2>
              <ul className="space-y-3">
                {pageItem.items.map((product) => (
                  <li data-product-id={product.id} key={product.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 break-words text-sm font-medium text-zinc-100">{product.title}</h3>
                      <span className="shrink-0 whitespace-nowrap rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                        ${product.price}
                      </span>
                    </div>
                    <p className="mt-2 max-h-10 overflow-hidden break-words text-xs text-zinc-400">{product.description}</p>
                    <p className="mt-2 break-words text-[11px] text-zinc-500">
                      {product.category} · rating {product.rating} · stock {product.stock}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div ref={setSentinelRef} className="py-6 text-center text-xs text-zinc-500">
          {!error && (
            <p role="status" aria-live="polite" aria-atomic="true">
              {isLoading ? "상품을 불러오는 중…" : canLoadMore ? "스크롤하면 다음 페이지를 불러옵니다." : "마지막 페이지입니다."}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
