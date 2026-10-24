import { observeDashboard } from "../../../ssr-lab/framework-dashboard/_lib/observer.server";
import { isFrameworkId, parseObserverRequest } from "../../../ssr-lab/framework-dashboard/_lib/types";
import type { ObserverResponse } from "../../../ssr-lab/framework-dashboard/_lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ framework: string }> }) {
  const { framework } = await params;
  const options = parseObserverRequest(new URL(request.url).searchParams);
  if (!isFrameworkId(framework) || !options) {
    const result: ObserverResponse = {
      ok: false, framework: isFrameworkId(framework) ? framework : null,
      request: options ?? { delayMs: 400, team: "alpha" }, observedAt: new Date().toISOString(),
      source: null, upstreamStatus: null, metrics: null, html: null,
      error: { code: !isFrameworkId(framework) ? "invalid-target" : "invalid-request", message: "등록된 프레임워크와 팀, 지연 조건만 관찰할 수 있습니다." },
    };
    return Response.json(result, { status: 400, headers: { "cache-control": "no-store" } });
  }
  const result = await observeDashboard(framework, options, request.signal);
  return Response.json(result, { headers: { "cache-control": "no-store" } });
}
