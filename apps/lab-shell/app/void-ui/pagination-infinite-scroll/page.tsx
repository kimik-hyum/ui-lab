import { PaginationInfiniteClient } from "./PaginationInfiniteClient";

const PAGE_SIZE = 10;
const PAGE_PARAM_KEY = "page";

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

type SearchParamValue = string | string[] | undefined;
type PageSearchParams = Record<string, SearchParamValue>;

type PaginationInfiniteScrollPageProps = {
  searchParams?: Promise<PageSearchParams> | PageSearchParams;
};

const parsePage = (value: SearchParamValue): number => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
};

async function fetchInitialProducts(page: number): Promise<ProductsResponse> {
  const skip = (page - 1) * PAGE_SIZE;
  const response = await fetch(
    `https://dummyjson.com/products?limit=${PAGE_SIZE}&skip=${skip}`,
    { next: { revalidate: 60 } },
  );

  if (!response.ok) {
    throw new Error("초기 상품 데이터를 불러오지 못했습니다.");
  }

  return (await response.json()) as ProductsResponse;
}

export default async function PaginationInfiniteScrollPage({
  searchParams,
}: PaginationInfiniteScrollPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const initialPage = parsePage(resolvedSearchParams[PAGE_PARAM_KEY]);
  const initialData = await fetchInitialProducts(initialPage);

  return (
    <PaginationInfiniteClient
      initialPage={initialPage}
      initialProducts={initialData.products}
      initialTotal={initialData.total}
      pageSize={initialData.limit}
      syncUrl
      restoreFromUrl
      pageParamKey={PAGE_PARAM_KEY}
      preserveExistingParams
    />
  );
}
