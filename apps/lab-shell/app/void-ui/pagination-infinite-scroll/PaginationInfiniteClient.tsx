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
    <main className="workspace-page text-foreground">
      <div className="w-full min-w-0">
        <header className="mb-7 border-b border-border pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent">Void UI / Hybrid Navigation</p>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/void-ui/pagination-infinite-scroll/adapter-live"
                className="inline-flex min-h-9 items-center rounded-lg border border-border bg-white px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
              >
                Virtuoso 실행 데모
              </Link>
              <Link
                href="/void-ui/pagination-infinite-scroll/adapter-view"
                className="inline-flex min-h-9 items-center rounded-lg border border-border bg-white px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
              >
                Adapter 뷰 예시
              </Link>
              <Link
                href="/void-ui/pagination-infinite-scroll/hook"
                className="inline-flex min-h-9 items-center rounded-lg border border-border bg-white px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
              >
                Hook 코드 해설
              </Link>
            </div>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Pagination + Infinite Scroll</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            페이지 번호로 바로 이동하거나 스크롤을 이어가며 상품 목록을 탐색해 보세요.
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
                onBlur={() => {
                  handlePageInputMove();
                }}
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
              onClick={handleGoToFirst}
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
              onClick={handleGoToLast}
              disabled={isLoading || currentPage === totalPages}
              className="min-h-10 rounded-lg border border-border bg-white px-4 py-2 text-foreground transition-colors enabled:hover:border-accent/40 enabled:hover:bg-accent-subtle enabled:hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              마지막
            </button>
            </div>
          </nav>
        </div>

        <div className="space-y-6">
          {pages.map((pageItem) => (
            <section
              key={pageItem.page}
              data-page={pageItem.page}
              ref={(node) => setPageRef(pageItem.page, node)}
              className="scroll-mt-48 rounded-xl border border-border bg-white p-4 sm:scroll-mt-36 sm:p-5"
            >
              <h2 className="mb-4 font-mono text-xs font-medium tracking-wide text-accent">PAGE {pageItem.page}</h2>
              <ul className="space-y-3">
                {pageItem.items.map((product) => (
                  <li key={product.id} className="rounded-lg border border-border bg-surface/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-medium text-foreground">{product.title}</h3>
                      <span className="shrink-0 rounded-md bg-accent-subtle px-2 py-1 font-mono text-xs text-accent">
                        ${product.price}
                      </span>
                    </div>
                    <p className="mt-2 max-h-10 overflow-hidden text-xs text-muted-foreground">{product.description}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {product.category} · rating {product.rating} · stock {product.stock}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div ref={setSentinelRef} className="py-8 text-center text-xs text-muted-foreground">
          {isLoading
            ? "다음 페이지 로딩 중..."
            : canLoadMore
              ? "스크롤하면 다음 페이지를 불러옵니다."
              : "마지막 페이지입니다."}
        </div>

        {error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs leading-6 text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
