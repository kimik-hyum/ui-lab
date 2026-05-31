import type { ProductRow } from "../../../types/product";

export type ShoppingDetailSsrLoaderData = {
  product: ProductRow;
  requestedSlug: string;
  source: "react-router-loader-direct-supabase";
};
