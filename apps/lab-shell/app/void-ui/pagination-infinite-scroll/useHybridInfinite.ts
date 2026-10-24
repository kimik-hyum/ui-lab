import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export type InfinitePage<T> = {
  page: number;
  items: T[];
};

export type FetchPageResult<T> = {
  items: T[];
  total: number;
};

type LoadMode = "append" | "prepend" | "replace";

export interface HybridViewportAdapter {
  setPageRef?: (page: number, node: HTMLElement | null) => void;
  setSentinelRef?: (node: HTMLElement | null) => void;
  watchCurrentPage?: (onChange: (page: number) => void) => () => void;
  watchLoadPrevious?: (onNeedPrevious: () => void) => () => void;
  watchLoadMore?: (onNeedMore: () => void) => () => void;
  scrollToPage?: (page: number, behavior?: ScrollBehavior) => boolean;
}

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
  adapter?: HybridViewportAdapter;
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
  adapter,
}: UseHybridInfiniteOptions<T>) {
  const [pages, setPages] = useState<InfinitePage<T>[]>([initialPage]);
  const [total, setTotal] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(initialPage.page);
  const [isLoading, setIsLoading] = useState(false);
  const [previousAutoEnabled, setPreviousAutoEnabled] = useState(false);
  const [listVersion, setListVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRestoreReady, setIsRestoreReady] = useState(!restoreFromUrl);

  const requestedPagesRef = useRef<Set<number>>(new Set([initialPage.page]));
  const previousAutoEnabledRef = useRef(false);
  const pageRefsRef = useRef<Map<number, HTMLElement>>(new Map());
  const visibilityRatioRef = useRef<Map<number, number>>(new Map());
  const previousSentinelRef = useRef<HTMLElement | null>(null);
  const prependAnchorRef = useRef<{ node: HTMLElement; top: number } | null>(null);
  const previousScrollYRef = useRef(0);
  const replaceScrollRef = useRef(false);
  const sentinelRef = useRef<HTMLElement | null>(null);
  const activeRequestRef = useRef<{ controller: AbortController; page: number; mode: LoadMode } | null>(null);
  const failedRequestRef = useRef<{ page: number; mode: LoadMode } | null>(null);
  const didRestoreFromUrlRef = useRef(false);
  const requiresUrlRestoreRef = useRef(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const maxLoadedPage = useMemo(() => pages.reduce((max, item) => Math.max(max, item.page), 1), [pages]);
  const minLoadedPage = pages[0]?.page ?? initialPage.page;
  const canLoadPrevious = minLoadedPage > 1;
  const canLoadMore = maxLoadedPage < totalPages;

  useLayoutEffect(() => {
    // The URL restores a page, not the old document's accumulated scroll offset.
    const restoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, behavior: "instant" });
    return () => { window.history.scrollRestoration = restoration; };
  }, []);

  // [cmp:load-page-core:start]
  const loadPage = useCallback(
    async (page: number, mode: LoadMode = "append") => {
      if (!Number.isInteger(page) || page < 1) return false;
      if (page > totalPages) return false;
      if (mode !== "replace" && requestedPagesRef.current.has(page)) return false;
      // Observer callbacks can run before React commits the loading state.
      if (activeRequestRef.current) return false;

      const controller = new AbortController();
      const request = { controller, page, mode };
      activeRequestRef.current = request;
      failedRequestRef.current = null;

      if (mode !== "replace") {
        requestedPagesRef.current.add(page);
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchPage({ page, pageSize, signal: controller.signal });
        // A fetcher may resolve after cancellation; it must not restore an old list.
        if (controller.signal.aborted || activeRequestRef.current !== request) return false;
        setTotal(data.total);

        if (mode === "replace") {
          requestedPagesRef.current = new Set([page]);
          pageRefsRef.current.clear();
          visibilityRatioRef.current.clear();
          previousAutoEnabledRef.current = false;
          setPreviousAutoEnabled(false);
          setListVersion((version) => version + 1);
          replaceScrollRef.current = true;
          setPages([{ page, items: data.items }]);
          setCurrentPage(page);
          return true;
        }

        if (mode === "prepend" && !adapter) {
          // Capture immediately before the commit: the user may scroll during the request.
          const node = [...pageRefsRef.current.entries()]
            .sort(([a], [b]) => a - b)
            .map(([, element]) => element)
            .find((element) => element.getBoundingClientRect().bottom > 0);
          if (node) prependAnchorRef.current = { node, top: node.getBoundingClientRect().top };
        }
        setPages((prev) => {
          if (prev.some((item) => item.page === page)) return prev;
          return [...prev, { page, items: data.items }].sort((a, b) => a.page - b.page);
        });
        return true;
      } catch {
        if (controller.signal.aborted || activeRequestRef.current !== request) return false;
        if (mode !== "replace") {
          requestedPagesRef.current.delete(page);
        }
        failedRequestRef.current = { page, mode };
        setError(`${page}페이지를 불러오지 못했습니다. 기존 목록은 유지됩니다.`);
        return false;
      } finally {
        if (activeRequestRef.current === request) {
          activeRequestRef.current = null;
          setIsLoading(false);
        }
      }
    },
    [adapter, fetchPage, pageSize, totalPages],
  );

  const retry = useCallback(async () => {
    const failed = failedRequestRef.current;
    return failed ? loadPage(failed.page, failed.mode) : false;
  }, [loadPage]);
  // [cmp:load-page-core:end]

  const loadNext = useCallback(async () => {
    // A visible sentinel must not repeatedly retry a failed network request.
    if (failedRequestRef.current) return false;
    // A virtual list can emit before the previous subscription is cleaned up.
    // The request registry already reflects a committed page replacement.
    const lastPage = Math.max(1, ...requestedPagesRef.current);
    return loadPage(lastPage + 1, "append");
  }, [loadPage]);

  // [cmp:load-previous:start]
  const loadPrevious = useCallback(async () => {
    if (!previousAutoEnabledRef.current || failedRequestRef.current) return false;
    const firstPage = Math.min(...requestedPagesRef.current);
    return loadPage(firstPage - 1, "prepend");
  }, [loadPage]);

  const enablePrevious = useCallback(() => {
    previousAutoEnabledRef.current = true;
    setPreviousAutoEnabled(true);
    return loadPrevious();
  }, [loadPrevious]);

  useLayoutEffect(() => {
    const anchor = prependAnchorRef.current;
    prependAnchorRef.current = null;
    if (anchor?.node.isConnected) {
      window.scrollBy({ top: anchor.node.getBoundingClientRect().top - anchor.top, behavior: "instant" });
    }
    if (replaceScrollRef.current) {
      replaceScrollRef.current = false;
      if (!adapter) pageRefsRef.current.get(minLoadedPage)?.scrollIntoView({ block: "start", behavior: "instant" });
    }
    previousScrollYRef.current = window.scrollY;
  }, [adapter, minLoadedPage, pages]);

  const setPreviousSentinelRef = useCallback((node: HTMLElement | null) => {
    previousSentinelRef.current = node;
  }, []);

  useEffect(() => {
    if (!previousAutoEnabled || !canLoadPrevious || error) return;
    if (adapter?.watchLoadPrevious) return adapter.watchLoadPrevious(() => { void loadPrevious(); });

    previousScrollYRef.current = window.scrollY;
    const onScroll = () => {
      const movingUp = window.scrollY < previousScrollYRef.current;
      previousScrollYRef.current = window.scrollY;
      const top = previousSentinelRef.current?.getBoundingClientRect().top;
      // Only upward movement triggers a request; mounting or re-observing cannot drain pages.
      if (movingUp && top !== undefined && top >= -200 && top <= window.innerHeight) void loadPrevious();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [adapter, canLoadPrevious, error, loadPrevious, previousAutoEnabled]);
  // [cmp:load-previous:end]

  const ensurePageLoaded = useCallback(
    async (page: number) => {
      if (pages.some((item) => item.page === page)) {
        return true;
      }
      return loadPage(page, page < minLoadedPage ? "prepend" : "append");
    },
    [loadPage, minLoadedPage, pages],
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
      const handledByAdapter = adapter?.scrollToPage?.(page, behavior) ?? false;
      if (handledByAdapter) return true;

      const target = pageRefsRef.current.get(page);
      if (!target) return false;

      target.scrollIntoView({
        behavior,
        block: "start",
      });
      return true;
    },
    [adapter],
  );

  const setPageRef = useCallback((page: number, node: HTMLElement | null) => {
    adapter?.setPageRef?.(page, node);

    if (node) {
      pageRefsRef.current.set(page, node);
      return;
    }
    pageRefsRef.current.delete(page);
    visibilityRatioRef.current.delete(page);
  }, [adapter]);

  const setSentinelRef = useCallback((node: HTMLElement | null) => {
    adapter?.setSentinelRef?.(node);
    sentinelRef.current = node;
  }, [adapter]);

  // [cmp:page-observer:start]
  useEffect(() => {
    if (adapter?.watchCurrentPage) {
      return adapter.watchCurrentPage((page) => {
        if (!Number.isInteger(page) || page < 1) return;
        setCurrentPage(page);
      });
    }

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
  }, [adapter, pageObserverRootMargin, pageObserverThreshold, pages]);
  // [cmp:page-observer:end]

  // [cmp:load-more-observer:start]
  useEffect(() => {
    if (error || !canLoadMore) return;
    if (adapter?.watchLoadMore) {
      return adapter.watchLoadMore(() => {
        void loadNext();
      });
    }

    const node = sentinelRef.current;
    if (!node) return;

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
  }, [adapter, canLoadMore, error, loadMoreRootMargin, loadMoreThreshold, loadNext, maxLoadedPage]);
  // [cmp:load-more-observer:end]

  // [cmp:url-restore:start]
  useEffect(() => {
    if (!restoreFromUrl) return;
    if (didRestoreFromUrlRef.current) return;
    didRestoreFromUrlRef.current = true;

    const pageFromUrl = parsePageFromSearch(new URL(window.location.href).searchParams.get(pageParamKey));
    if (!pageFromUrl || pageFromUrl === initialPage.page) {
      return;
    }

    // 실제 복원 요청이 있는 동안에만 URL 덮어쓰기를 막습니다.
    requiresUrlRestoreRef.current = true;
    // 브라우저 URL에서 복원하는 네트워크 요청은 시작 즉시 loading을 표시해야 합니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void goToPage(pageFromUrl).finally(() => {
      setIsRestoreReady(true);
    });
  }, [goToPage, initialPage.page, pageParamKey, restoreFromUrl]);
  // [cmp:url-restore:end]

  // [cmp:url-sync:start]
  useEffect(() => {
    if (!syncUrl || (requiresUrlRestoreRef.current && !isRestoreReady)) return;

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
      const request = activeRequestRef.current;
      activeRequestRef.current = null;
      if (request && request.mode !== "replace") requestedPagesRef.current.delete(request.page);
      request?.controller.abort();
    };
  }, []);

  return {
    pages,
    currentPage,
    totalPages,
    isLoading,
    error,
    retry,
    canLoadMore,
    canLoadPrevious,
    previousAutoEnabled,
    enablePrevious,
    setPreviousSentinelRef,
    listVersion,
    setPageRef,
    setSentinelRef,
    loadNext,
    ensurePageLoaded,
    goToPage,
    isPageLoaded,
    scrollToPage,
  };
}
