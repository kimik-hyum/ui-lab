import {
  getSupabaseServerClient,
  type ProductRow,
} from "@/lib/supabase-server";

export const DEFAULT_PRODUCT_SLUG = "wireless-headphones-x1";

const PRODUCT_COLUMNS =
  "id, slug, name, brand, price, currency, description, image_url, image_width, image_height, stock, rating, created_at";

export type ShoppingDetailSsrViewModel = {
  product: ProductRow;
  formattedPrice: string;
  formattedCreatedAt: string;
  sourceLabel: string;
};

export async function loadShoppingDetailSsrProduct(
  slug: string,
): Promise<ProductRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(`상품 조회 실패: ${error.message}`);
  }

  return data;
}

export function toShoppingDetailSsrViewModel(
  product: ProductRow,
): ShoppingDetailSsrViewModel {
  return {
    product,
    formattedPrice: new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: product.currency,
      maximumFractionDigits: 0,
    }).format(product.price),
    formattedCreatedAt: new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Seoul",
    }).format(new Date(product.created_at)),
    sourceLabel: "Next.js Server Component -> Supabase server helper",
  };
}
