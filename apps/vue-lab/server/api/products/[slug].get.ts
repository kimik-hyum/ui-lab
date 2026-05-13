import type { ProductApiResponse } from "../../../types/product";
import { getSupabaseServerClient } from "../../utils/supabase";

export default defineEventHandler(async (event): Promise<ProductApiResponse> => {
  const slug = getRouterParam(event, "slug");

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "상품 slug가 필요합니다.",
    });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, slug, name, brand, price, currency, description, image_url, image_width, image_height, stock, rating, created_at",
      )
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw createError({
          statusCode: 404,
          statusMessage: "상품을 찾을 수 없습니다.",
        });
      }

      throw createError({
        statusCode: 500,
        statusMessage: "상품 조회 중 오류가 발생했습니다.",
        message: error.message,
      });
    }

    return {
      product: data,
      fetchedAt: new Date().toISOString(),
      source: "nuxt-api",
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "서버 설정 오류가 발생했습니다.",
      message: error instanceof Error ? error.message : "unknown",
    });
  }
});
