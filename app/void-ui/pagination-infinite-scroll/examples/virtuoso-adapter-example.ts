import type { ListRange } from "react-virtuoso";
import type { HybridViewportAdapter } from "../useHybridInfinite";

type CreateVirtuosoAdapterOptions = {
  pageSize: number;
  getTotalCount: () => number;
  getFirstLoadedPage: () => number;
  scrollToIndex: (args: {
    index: number;
    behavior?: "smooth" | "auto";
  }) => void;
  loadMoreThreshold?: number;
};

type RangeListener = (range: ListRange) => void;

export type VirtuosoHybridAdapter = HybridViewportAdapter & {
  onRangeChanged: (range: ListRange) => void;
};

const clampPage = (page: number): number => {
  if (!Number.isInteger(page) || page < 1) return 1;
  return page;
};

// [cmp:adapter-factory:start]
export function createVirtuosoAdapter({
  pageSize,
  getTotalCount,
  getFirstLoadedPage,
  scrollToIndex,
  loadMoreThreshold = 6,
}: CreateVirtuosoAdapterOptions): VirtuosoHybridAdapter {
  const currentPageListeners = new Set<(page: number) => void>();
  const loadMoreListeners = new Set<() => void>();
  const rangeListeners = new Set<RangeListener>();

  const onRangeChanged = (range: ListRange) => {
    rangeListeners.forEach((listener) => listener(range));
  };

  const watchCurrentPage = (onChange: (page: number) => void) => {
    currentPageListeners.add(onChange);

    const listener: RangeListener = (range) => {
      const firstLoadedPage = clampPage(getFirstLoadedPage());
      const page = clampPage(firstLoadedPage + Math.floor(range.startIndex / pageSize));
      currentPageListeners.forEach((notify) => notify(page));
    };

    rangeListeners.add(listener);
    return () => {
      currentPageListeners.delete(onChange);
      rangeListeners.delete(listener);
    };
  };

  const watchLoadMore = (onNeedMore: () => void) => {
    loadMoreListeners.add(onNeedMore);

    const listener: RangeListener = (range) => {
      const lastIndex = getTotalCount() - 1;
      if (lastIndex < 0) return;

      if (range.endIndex >= lastIndex - loadMoreThreshold) {
        loadMoreListeners.forEach((notify) => notify());
      }
    };

    rangeListeners.add(listener);
    return () => {
      loadMoreListeners.delete(onNeedMore);
      rangeListeners.delete(listener);
    };
  };

  return {
    watchCurrentPage,
    watchLoadMore,
    scrollToPage: (page, behavior = "smooth") => {
      const firstLoadedPage = clampPage(getFirstLoadedPage());
      const index = Math.max(0, (page - firstLoadedPage) * pageSize);
      scrollToIndex({
        index,
        behavior: behavior === "smooth" ? "smooth" : "auto",
      });
      return true;
    },
    // virtualization에서는 DOM ref 바인딩이 필요하지 않아 no-op 처리.
    setPageRef: () => {},
    setSentinelRef: () => {},
    onRangeChanged,
  };
}
// [cmp:adapter-factory:end]
