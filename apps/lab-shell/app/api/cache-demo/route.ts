import { setTimeout } from "node:timers/promises";
import { NextRequest, NextResponse } from "next/server";
import { CACHE_DELAY_MS } from "../../front-feature/libraries/cache/config";
import { CACHE_RECORDS } from "../../front-feature/libraries/cache/records.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const item = request.nextUrl.searchParams.get("item") ?? "alpha";
  const headers = { "Cache-Control": "no-store" };
  if (item !== "alpha" && item !== "beta" && item !== "error") {
    return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404, headers });
  }
  // 양쪽 구현에 같은 대기 시간을 주는 고정 fixture입니다.
  await setTimeout(CACHE_DELAY_MS);
  if (item === "error") {
    return NextResponse.json({ error: "오류 응답 예시입니다." }, { status: 503, headers });
  }
  return NextResponse.json(CACHE_RECORDS[item], { headers });
}
