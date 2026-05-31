import type { ProductRow } from "../../../types/product";
import { getSupabaseServerClient } from "../supabase";

const PRODUCT_SELECT =
  "id, slug, name, brand, price, currency, description, image_url, image_width, image_height, stock, rating, created_at";

export async function getShoppingDetailSsrProduct(slug: string): Promise<ProductRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(error.message);
  }

  return data;
}
