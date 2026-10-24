import { notFound } from "next/navigation";
import "../../../../../fixtures/dashboard-ssr.css";
import DashboardSsrView from "./_components/DashboardSsrView";
// [cmp:boundary:start]
import { loadDashboardSsr, resolveDashboardDelay } from "./_lib/dashboard-ssr-data.server";

export const dynamic = "force-dynamic";
// Server Component가 자기 API를 거치지 않고 서버 함수를 직접 호출합니다.
// [cmp:boundary:end]

export default async function DashboardSsrPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // [cmp:loading:start]
  const query = await searchParams;
  const delayMs = resolveDashboardDelay(query.delay);
  const dashboard = await loadDashboardSsr(query.team, delayMs);
  if (!dashboard) notFound();
  // [cmp:loading:end]

  // [cmp:output:start]
  // loading.tsx나 Suspense 없이 데이터가 준비된 뒤 전체 화면을 반환합니다.
  return <DashboardSsrView data={dashboard} delayMs={delayMs} />;
  // [cmp:output:end]
}
