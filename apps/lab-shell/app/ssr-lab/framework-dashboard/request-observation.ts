import type { FrameworkId, ObserverRequest } from "./_lib/types";
import type { Observation } from "./presentation";
import { parseObservationResponse } from "./observation-response";

export const OBSERVATION_REQUEST_TIMEOUT_MS = 15_000;

/** The browser deadline covers both response headers and the complete JSON body. */
export async function requestObservation(
  framework: FrameworkId,
  request: ObserverRequest,
  lifecycle: AbortSignal,
  { fetchImpl = fetch, timeoutMs = OBSERVATION_REQUEST_TIMEOUT_MS }: {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
  } = {},
): Promise<Observation | null> {
  if (lifecycle.aborted) return null;
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  lifecycle.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetchImpl(`/api/ssr-observer/${framework}?delay=${request.delayMs}&team=${request.team}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok && response.status !== 400) {
      controller.abort();
      throw new Error("Observer request failed");
    }
    const payload: unknown = await response.json();
    if (lifecycle.aborted) return null;
    if (timedOut) throw new Error("Observer request timed out");
    const value = parseObservationResponse(payload, framework, request);
    if (!value) return {
      kind: "network-error",
      message: "현재 조건에 맞는 관찰 결과를 받지 못했습니다. ‘두 응답 다시 확인’을 눌러 재시도해 주세요.",
    };
    return { kind: "response", value };
  } catch {
    // Changing conditions or leaving the page must never display an old failure.
    if (lifecycle.aborted) return null;
    return {
      kind: "network-error",
      message: timedOut
        ? "관찰 결과를 15초 안에 받지 못했습니다. ‘두 응답 다시 확인’을 눌러 재시도해 주세요."
        : "관찰 요청을 완료하지 못했습니다. ‘두 응답 다시 확인’을 눌러 재시도해 주세요.",
    };
  } finally {
    clearTimeout(timer);
    lifecycle.removeEventListener("abort", cancel);
  }
}
