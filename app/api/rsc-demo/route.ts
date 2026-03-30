import { NextRequest, NextResponse } from "next/server";
import { DEMO_ARTICLE } from "../../front-feature/nextjs/rsc-vs-csc/article";

export async function GET(req: NextRequest) {
  const delay = Math.min(
    Number(req.nextUrl.searchParams.get("delay") ?? "0"),
    5000,
  );

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return NextResponse.json(DEMO_ARTICLE);
}
