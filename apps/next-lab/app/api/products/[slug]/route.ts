import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;

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
        return NextResponse.json({ message: "상품을 찾을 수 없습니다." }, { status: 404 });
      }

      return NextResponse.json(
        { message: "상품 조회 중 오류가 발생했습니다.", error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      product: data,
      fetchedAt: new Date().toISOString(),
      source: "next-api",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "서버 설정 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 },
    );
  }
}
