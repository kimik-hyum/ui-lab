import { getSupabaseServerClient } from "../../../lib/supabase.server";
import type { ProductRow } from "../../../types/product";

export const SHOPPING_DETAIL_SSR_DEFAULT_SLUG = "wireless-headphones-x1";

const PRODUCT_COLUMNS =
  "id, slug, name, brand, price, currency, description, image_url, image_width, image_height, stock, rating, created_at";

export async function getShoppingDetailSsrProduct(slug: string): Promise<ProductRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`상품 조회 중 오류가 발생했습니다: ${error.message}`);
  }

  return data as ProductRow | null;
}
