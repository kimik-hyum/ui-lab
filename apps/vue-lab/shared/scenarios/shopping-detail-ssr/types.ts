import type { ProductRow } from "../../../types/product";

export const SHOPPING_DETAIL_SSR_DEFAULT_SLUG = "wireless-headphones-x1";
export const SHOPPING_DETAIL_SSR_SOURCE =
  "Nuxt useFetch(server:true) -> Nitro server util -> Supabase";

export type ShoppingDetailSsrResponse = {
  product: ProductRow;
  requestedSlug: string;
  source: string;
};
