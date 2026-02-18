export type VirtuosoRange = {
  startIndex: number;
  endIndex: number;
};

export type VirtuosoLikeHandle = {
  scrollToIndex: (args: {
    index: number;
    align?: "start" | "center" | "end";
    behavior?: "auto" | "smooth";
  }) => void;
};

export type HybridViewportAdapter = {
  scrollToPage: (page: number, behavior?: ScrollBehavior) => boolean;
  watchCurrentPage: (onChange: (page: number) => void) => () => void;
  watchLoadMore: (onNeedMore: () => void) => () => void;
  setPageRef: (page: number, node: HTMLElement | null) => void;
  setSentinelRef: (node: HTMLElement | null) => void;
};

type CreateVirtuosoAdapterOptions = {
  getHandle: () => VirtuosoLikeHandle | null;
  pageSize: number;
  totalItems: () => number;
  subscribeRangeChange: (listener: (range: VirtuosoRange) => void) => () => void;
  loadMoreThreshold?: number;
};

const clampPage = (page: number): number => {
  if (page < 1) return 1;
  return page;
};

// [cmp:adapter-factory:start]
export function createVirtuosoAdapter({
  getHandle,
  pageSize,
  totalItems,
  subscribeRangeChange,
  loadMoreThreshold = 6,
}: CreateVirtuosoAdapterOptions): HybridViewportAdapter {
  // react-virtuoso에서는 DOM ref 대신 range callback으로 현재 위치를 추적합니다.
  const watchCurrentPage = (onChange: (page: number) => void) => {
    return subscribeRangeChange((range) => {
      const page = clampPage(Math.floor(range.startIndex / pageSize) + 1);
      onChange(page);
    });
  };

  const watchLoadMore = (onNeedMore: () => void) => {
    return subscribeRangeChange((range) => {
      const lastIndex = totalItems() - 1;
      if (lastIndex < 0) return;
      if (range.endIndex >= lastIndex - loadMoreThreshold) {
        onNeedMore();
      }
    });
  };

  return {
    scrollToPage: (page, behavior = "smooth") => {
      const handle = getHandle();
      if (!handle) return false;

      const index = Math.max(0, (page - 1) * pageSize);
      handle.scrollToIndex({
        index,
        align: "start",
        behavior: behavior === "smooth" ? "smooth" : "auto",
      });
      return true;
    },
    watchCurrentPage,
    watchLoadMore,
    // virtualization에서는 DOM 요소 ref가 없어도 되므로 no-op 처리.
    setPageRef: () => {},
    setSentinelRef: () => {},
  };
}
// [cmp:adapter-factory:end]
