import "server-only";
import { setTimeout as wait } from "node:timers/promises";
import fixture from "../../../../../../fixtures/dashboard-ssr.json";
import type { DashboardData } from "../../../../../../fixtures/dashboard-ssr-types";

export function resolveDashboardDelay(value: string | string[] | null | undefined): number {
  return [0, 400, 800].find((delay) => String(delay) === value) ?? 400;
}

export async function loadDashboardSsr(
  team: string | string[] | null | undefined,
  delayMs: number,
): Promise<DashboardData | null> {
  const teamId = team || "alpha";

  // 외부 서비스 성능이 아닌, 모든 프레임워크에 같은 서버 I/O 인공지연입니다.
  if (delayMs > 0) await wait(delayMs);
  if (teamId !== fixture.team.id && teamId !== "empty") return null;
  return teamId === "empty"
    ? { ...fixture, team: { id: "empty", name: "빈 팀" }, summary: fixture.summary.map((item) => ({ ...item, value: 0 })), activities: [] }
    : fixture;
}
