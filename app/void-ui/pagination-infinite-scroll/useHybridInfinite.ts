import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type InfinitePage<T> = {
  page: number;
  items: T[];
};

export type FetchPageResult<T> = {
  items: T[];
  total: number;
};

type LoadMode = "append" | "replace";

export interface UseHybridInfiniteOptions<T> {
  initialPage: InfinitePage<T>;
  initialTotal: number;
  pageSize: number;
  fetchPage: (args: { page: number; pageSize: number; signal?: AbortSignal }) => Promise<FetchPageResult<T>>;
  syncUrl?: boolean;
  restoreFromUrl?: boolean;
  pageParamKey?: string;
  historyMode?: "replace" | "push";
  pageObserverRootMargin?: string;
  pageObserverThreshold?: number | number[];
  loadMoreRootMargin?: string;
  loadMoreThreshold?: number | number[];
  preserveExistingParams?: boolean;
}

const PAGE_OBSERVER_THRESHOLD = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1];

const parsePageFromSearch = (value: string | null): number | null => {
  if (!value) return null;
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) return null;
  return page;
};

export function useHybridInfinite<T>({
  initialPage,
  initialTotal,
  pageSize,
  fetchPage,
  syncUrl = false,
  restoreFromUrl = false,
  pageParamKey = "page",
  historyMode = "replace",
  pageObserverRootMargin = "-10% 0px -55% 0px",
  pageObserverThreshold = PAGE_OBSERVER_THRESHOLD,
  loadMoreRootMargin = "0px 0px 320px 0px",
  loadMoreThreshold = 0,
  preserveExistingParams = true,
}: UseHybridInfiniteOptions<T>) {
  const [pages, setPages] = useState<InfinitePage<T>[]>([initialPage]);
  const [total, setTotal] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(initialPage.page);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRestoreReady, setIsRestoreReady] = useState(!restoreFromUrl);

  const requestedPagesRef = useRef<Set<number>>(new Set([initialPage.page]));
  const pageRefsRef = useRef<Map<number, HTMLElement>>(new Map());
  const visibilityRatioRef = useRef<Map<number, number>>(new Map());
  const sentinelRef = useRef<HTMLElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const didRestoreFromUrlRef = useRef(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const maxLoadedPage = useMemo(() => pages.reduce((max, item) => Math.max(max, item.page), 1), [pages]);
  const canLoadMore = maxLoadedPage < totalPages;

  // [cmp:load-page-core:start]
  const loadPage = useCallback(
    async (page: number, mode: LoadMode = "append") => {
      if (page < 1) return false;
      if (page > totalPages) return false;
      if (mode === "append" && requestedPagesRef.current.has(page)) return false;
      if (isLoading) return false;

      const controller = new AbortController();
      abortControllerRef.current?.abort();
      abortControllerRef.current = controller;

      if (mode === "append") {
        requestedPagesRef.current.add(page);
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchPage({ page, pageSize, signal: controller.signal });
        setTotal(data.total);

        if (mode === "replace") {
          requestedPagesRef.current = new Set([page]);
          pageRefsRef.current.clear();
          visibilityRatioRef.current.clear();
          setPages([{ page, items: data.items }]);
          setCurrentPage(page);
          return true;
        }

        setPages((prev) => {
          if (prev.some((item) => item.page === page)) return prev;
          return [...prev, { page, items: data.items }].sort((a, b) => a.page - b.page);
        });
        return true;
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return false;
        }
        if (mode === "append") {
          requestedPagesRef.current.delete(page);
        }
        setError("페이지 데이터를 불러오지 못했습니다.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPage, isLoading, pageSize, totalPages],
  );
  // [cmp:load-page-core:end]

  const loadNext = useCallback(async () => {
    return loadPage(maxLoadedPage + 1, "append");
  }, [loadPage, maxLoadedPage]);

  const ensurePageLoaded = useCallback(
    async (page: number) => {
      if (pages.some((item) => item.page === page)) {
        return true;
      }
      return loadPage(page, "append");
    },
    [loadPage, pages],
  );

  const goToPage = useCallback(
    async (page: number) => {
      return loadPage(page, "replace");
    },
    [loadPage],
  );

  const isPageLoaded = useCallback(
    (page: number) => {
      return pages.some((item) => item.page === page);
    },
    [pages],
  );

  const scrollToPage = useCallback(
    (page: number, behavior: ScrollBehavior = "smooth") => {
      const target = pageRefsRef.current.get(page);
      if (!target) return false;

      target.scrollIntoView({
        behavior,
        block: "start",
      });
      return true;
    },
    [],
  );

  const setPageRef = useCallback((page: number, node: HTMLElement | null) => {
    if (node) {
      pageRefsRef.current.set(page, node);
      return;
    }
    pageRefsRef.current.delete(page);
    visibilityRatioRef.current.delete(page);
  }, []);

  const setSentinelRef = useCallback((node: HTMLElement | null) => {
    sentinelRef.current = node;
  }, []);

  // [cmp:page-observer:start]
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageAttr = entry.target.getAttribute("data-page");
          if (!pageAttr) return;

          const page = Number(pageAttr);
          if (Number.isNaN(page)) return;

          visibilityRatioRef.current.set(page, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        const visiblePages = Array.from(visibilityRatioRef.current.entries())
          .filter(([, ratio]) => ratio > 0)
          .sort((a, b) => b[1] - a[1] || a[0] - b[0]);

        if (visiblePages.length > 0) {
          setCurrentPage(visiblePages[0][0]);
        }
      },
      {
        threshold: pageObserverThreshold,
        rootMargin: pageObserverRootMargin,
      },
    );

    pageRefsRef.current.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pageObserverRootMargin, pageObserverThreshold, pages]);
  // [cmp:page-observer:end]

  // [cmp:load-more-observer:start]
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !canLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadNext();
        }
      },
      {
        rootMargin: loadMoreRootMargin,
        threshold: loadMoreThreshold,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, loadMoreRootMargin, loadMoreThreshold, loadNext]);
  // [cmp:load-more-observer:end]

  // [cmp:url-restore:start]
  useEffect(() => {
    if (!restoreFromUrl) return;
    if (didRestoreFromUrlRef.current) return;
    didRestoreFromUrlRef.current = true;

    const pageFromUrl = parsePageFromSearch(new URL(window.location.href).searchParams.get(pageParamKey));
    if (!pageFromUrl || pageFromUrl === initialPage.page) {
      setIsRestoreReady(true);
      return;
    }

    void goToPage(pageFromUrl).finally(() => {
      setIsRestoreReady(true);
    });
  }, [goToPage, initialPage.page, pageParamKey, restoreFromUrl]);
  // [cmp:url-restore:end]

  // [cmp:url-sync:start]
  useEffect(() => {
    if (!syncUrl || !isRestoreReady) return;

    const url = new URL(window.location.href);
    if (!preserveExistingParams) {
      url.search = "";
    }
    url.searchParams.set(pageParamKey, String(currentPage));

    if (historyMode === "push") {
      window.history.pushState(null, "", url);
      return;
    }
    window.history.replaceState(null, "", url);
  }, [currentPage, historyMode, isRestoreReady, pageParamKey, preserveExistingParams, syncUrl]);
  // [cmp:url-sync:end]

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    pages,
    currentPage,
    totalPages,
    isLoading,
    error,
    canLoadMore,
    setPageRef,
    setSentinelRef,
    loadNext,
    ensurePageLoaded,
    goToPage,
    isPageLoaded,
    scrollToPage,
  };
}
