import { NextResponse } from "next/server";
import { getUpgradeLogs } from "../../upgrade-logs/_lib/logs.server";
import { summarizeUpgradeLog } from "../../upgrade-logs/_lib/summary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const logs = await getUpgradeLogs();
    return NextResponse.json({ logs: logs.map(summarizeUpgradeLog) }, { headers });
  } catch {
    return NextResponse.json({ error: "버전업 기록을 불러오지 못했습니다." }, { status: 500, headers });
  }
}
