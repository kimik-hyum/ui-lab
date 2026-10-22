import type { FrameworkId, ObserverMetrics, ObserverRequest, ObserverResponse, ObserverSource } from "./_lib/types";

const ERROR_CODES = new Set([
  "offline", "timeout", "not-found", "invalid-payload", "upstream-error",
  "too-large", "aborted", "invalid-target", "invalid-request",
]);

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function nonnegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function source(value: unknown): value is ObserverSource {
  return record(value) && text(value.label) && text(value.version)
    && value.path === "/scenarios/dashboard-ssr" && value.renderMode === "blocking";
}

function metrics(value: unknown, complete: boolean): value is ObserverMetrics {
  if (!record(value) || !nonnegative(value.responseStartMs) || !nonnegative(value.totalMs)
    || !nonnegative(value.htmlBytes) || !Number.isSafeInteger(value.htmlBytes)) return false;
  if (value.firstByteMs !== null && !nonnegative(value.firstByteMs)) return false;
  if (value.contentReadyMs !== null && !nonnegative(value.contentReadyMs)) return false;
  if (complete && (value.firstByteMs === null || value.contentReadyMs === null || value.htmlBytes === 0)) return false;
  const times = [value.responseStartMs, value.firstByteMs, value.contentReadyMs, value.totalMs]
    .filter((time): time is number => typeof time === "number");
  return times.every((time, index) => index === 0 || time >= times[index - 1]);
}

/** Check the browser-facing response contract; HTML validity belongs to the server observer. */
export function parseObservationResponse(
  value: unknown,
  framework: FrameworkId,
  request: ObserverRequest,
): ObserverResponse | null {
  if (!record(value) || value.framework !== framework || !record(value.request)
    || value.request.team !== request.team || value.request.delayMs !== request.delayMs
    || !text(value.observedAt) || !Number.isFinite(Date.parse(value.observedAt))) return null;

  if (value.ok === true) {
    if (!source(value.source) || value.upstreamStatus !== 200 || !metrics(value.metrics, true)
      || !text(value.html) || value.error !== null) return null;
  } else if (value.ok === false) {
    if ((value.source !== null && !source(value.source))
      || (value.metrics !== null && !metrics(value.metrics, false))
      || (value.upstreamStatus !== null && (!Number.isInteger(value.upstreamStatus)
        || Number(value.upstreamStatus) < 100 || Number(value.upstreamStatus) > 599))
      || value.html !== null || !record(value.error) || !text(value.error.code)
      || !ERROR_CODES.has(value.error.code) || !text(value.error.message)) return null;
  } else {
    return null;
  }
  return value as ObserverResponse;
}
