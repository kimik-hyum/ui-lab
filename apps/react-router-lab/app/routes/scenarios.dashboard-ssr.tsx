import { isRouteErrorResponse, useRouteError } from "react-router";
import type { Route } from "./+types/scenarios.dashboard-ssr";
import stylesheet from "../../../../fixtures/dashboard-ssr.css?url";
import DashboardSsrView from "../scenarios/dashboard-ssr/components/DashboardSsrView";
// [cmp:boundary:start]
import { loadDashboardSsr, resolveDashboardDelay } from "../scenarios/dashboard-ssr/lib/dashboard-ssr-data.server";

export const headers: Route.HeadersFunction = () => ({ "Cache-Control": "no-store" });
// loader와 .server 모듈은 브라우저 실행 코드에서 제외됩니다.
// [cmp:boundary:end]

export const links: Route.LinksFunction = () => [{ rel: "stylesheet", href: stylesheet }];

// [cmp:loading:start]
export async function loader({ request }: Route.LoaderArgs) {
  const query = new URL(request.url).searchParams;
  const delayMs = resolveDashboardDelay(query.get("delay"));
  const dashboard = await loadDashboardSsr(query.get("team"), delayMs);
  if (!dashboard) throw new Response("팀을 찾을 수 없습니다.", { status: 404 });
  return { dashboard, delayMs };
}
// [cmp:loading:end]

// [cmp:output:start]
export default function DashboardSsrRoute({ loaderData }: Route.ComponentProps) {
  // loader가 완료된 데이터를 전달하므로 Await/Suspense 없이 전체 화면을 렌더링합니다.
  return <DashboardSsrView data={loaderData.dashboard} delayMs={loaderData.delayMs} />;
}
// [cmp:output:end]

export function ErrorBoundary() {
  const error = useRouteError();
  const missing = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main className="ssr-dashboard">
      <h1>{missing ? "팀을 찾을 수 없습니다." : "작업 현황을 불러오지 못했습니다."}</h1>
      <p>{missing ? "이 시나리오는 alpha와 empty 팀을 제공합니다." : "서버 응답 중 오류가 발생했습니다. 페이지를 새로고침해 주세요."}</p>
    </main>
  );
}
