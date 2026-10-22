import "server-only";
import fixture from "../../../../../../fixtures/dashboard-ssr.json";
import { ObservationLimitError, observeResponse } from "./observe-response";
import { getObserverTarget } from "./targets";
import type { FrameworkId, ObserverErrorCode, ObserverMetrics, ObserverRequest, ObserverResponse, ObserverSource } from "./types";

const OBSERVER_TIMEOUT_MS = 10_000;

export async function observeDashboard(framework: FrameworkId, request: ObserverRequest, clientSignal: AbortSignal): Promise<ObserverResponse> {
  const observedAt = new Date().toISOString();
  let source: ObserverSource | null = null;
  let upstreamStatus: number | null = null;
  let metrics: ObserverMetrics | null = null;
  const timeout = AbortSignal.timeout(OBSERVER_TIMEOUT_MS);
  const signal = AbortSignal.any([timeout, clientSignal]);
  let response: Response | null = null;
  const fail = (code: ObserverErrorCode, message: string): ObserverResponse => ({
    ok: false, framework, request, observedAt, source, upstreamStatus, metrics, html: null, error: { code, message },
  });

  try {
    const target = getObserverTarget(framework);
    source = target.source;
    const url = new URL(source.path, target.origin);
    url.searchParams.set("team", request.team);
    url.searchParams.set("delay", String(request.delayMs));
    const startedAt = performance.now();
    response = await fetch(url, {
      signal,
      cache: "no-store",
      redirect: "manual",
      headers: { accept: "text/html", "user-agent": "ui-lab-ssr-observer", "cache-control": "no-cache" },
    });
    const responseStartMs = performance.now() - startedAt;
    upstreamStatus = response.status;
    if (response.status === 404) return fail("not-found", "요청한 팀을 찾을 수 없습니다. 서버가 HTTP 404를 반환했습니다.");
    if (response.status !== 200) return fail("upstream-error", `프레임워크 서버가 HTTP ${response.status}를 반환했습니다.`);
    if (!/^text\/html(?:\s*;|\s*$)/i.test(response.headers.get("content-type") ?? "")) return fail("invalid-payload", "서버 응답이 HTML 문서가 아닙니다.");
    const result = await observeResponse(response, { framework, request, fixture, startedAt, responseStartMs, signal });
    metrics = result.metrics;
    if (!result.valid || result.html === null) return fail("invalid-payload", "실제 HTML에서 같은 팀 데이터와 완료 마커를 확인하지 못했습니다.");
    return { ok: true, framework, request, observedAt, source, upstreamStatus: 200, metrics, html: result.html, error: null };
  } catch (error) {
    if (clientSignal.aborted) return fail("aborted", "관찰 요청을 취소했습니다.");
    if (timeout.aborted) return fail("timeout", "프레임워크 서버가 10초 안에 응답을 완료하지 못했습니다.");
    if (error instanceof ObservationLimitError) return fail("too-large", error.message);
    if (!source) return fail("invalid-target", "프레임워크 서버 주소 설정을 확인해주세요.");
    return fail("offline", "프레임워크 서버에 연결할 수 없습니다. 실행 상태를 확인해주세요.");
  } finally {
    if (response?.body && !response.body.locked) {
      try { await response.body.cancel(); } catch { /* Body may have been consumed or cancelled. */ }
    }
  }
}
