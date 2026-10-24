import { NextRequest, NextResponse } from "next/server";
import { loadArticle } from "../../front-feature/nextjs/rsc-vs-csc/article.server";
import { resolveArticleDelay } from "../../front-feature/nextjs/rsc-vs-csc/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const articleId = req.nextUrl.searchParams.get("article");
  if (articleId && articleId !== "rendering-guide") {
    return NextResponse.json({ error: "아티클을 찾을 수 없습니다." }, { status: 404 });
  }
  const delay = resolveArticleDelay(req.nextUrl.searchParams.get("delay"));
  const article = await loadArticle(delay);
  return NextResponse.json(article, { headers: { "Cache-Control": "no-store" } });
}
