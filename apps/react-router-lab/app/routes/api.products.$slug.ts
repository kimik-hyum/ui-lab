import type { Route } from "./+types/api.products.$slug";
import { getSupabaseServerClient } from "../lib/supabase.server";
import type { ProductApiResponse } from "../types/product";

export async function loader({ params }: Route.LoaderArgs) {
  const slug = params.slug;

  if (!slug) {
    return Response.json({ message: "상품 slug가 필요합니다." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, slug, name, brand, price, currency, description, image_url, image_width, stock, rating, image_height, created_at",
      )
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return Response.json({ message: "상품을 찾을 수 없습니다." }, { status: 404 });
      }

      return Response.json(
        { message: "상품 조회 중 오류가 발생했습니다.", error: error.message },
        { status: 500 },
      );
    }

    const payload: ProductApiResponse = {
      product: data,
      fetchedAt: new Date().toISOString(),
      source: "react-router-api",
    };

    return Response.json(payload);
  } catch (error) {
    return Response.json(
      {
        message: "서버 설정 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 },
    );
  }
}
