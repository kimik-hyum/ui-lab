'use client';

import { useHybridInfinite } from "../useHybridInfinite";
import { createVirtuosoAdapter, VirtuosoLikeHandle, VirtuosoRange } from "./virtuoso-adapter-example";

type Product = {
  id: number;
  title: string;
  price: number;
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
  // 라이브러리 실제 구현에서는 rangeChanged 이벤트를 구독하는 함수를 연결합니다.
  const subscribeRangeChange = (listener: (range: VirtuosoRange) => void) => {
    const unsubscribe = () => {};
    void listener;
    return unsubscribe;
  };

  const adapter = createVirtuosoAdapter({
    getHandle: (): VirtuosoLikeHandle | null => null,
    pageSize,
    totalItems: () => 0,
    subscribeRangeChange,
    loadMoreThreshold: 10,
  });

  const hybrid = useHybridInfinite<Product>({
    initialPage: { page: initialPage, items: initialProducts },
    initialTotal,
    pageSize,
    fetchPage: async ({ page, pageSize: limit, signal }) => {
      const skip = (page - 1) * limit;
      const response = await fetch(`https://dummyjson.com/products?limit=${limit}&skip=${skip}`, { signal });
      if (!response.ok) {
        throw new Error("상품 데이터를 불러오지 못했습니다.");
      }
      const data = (await response.json()) as ProductsResponse;
      return { items: data.products, total: data.total };
    },
    syncUrl: true,
    restoreFromUrl: true,
    pageParamKey: "p",
    preserveExistingParams: true,
  });

  // 향후 훅에서 adapter 옵션을 제공하면 아래처럼 주입 가능합니다.
  // const hybrid = useHybridInfinite({ ...options, adapter });
  void adapter;
  void hybrid;

  return null;
}
// [cmp:view-options:end]
