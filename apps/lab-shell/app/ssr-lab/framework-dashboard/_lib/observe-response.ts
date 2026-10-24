import type { DashboardData } from "../../../../../../fixtures/dashboard-ssr-types";
import { DashboardHtmlParser } from "./html-parser";
import type { FrameworkId, ObserverMetrics, ObserverRequest } from "./types";

export const MAX_HTML_BYTES = 1024 * 1024;

export class ObservationLimitError extends Error {
  constructor() { super("관찰할 HTML 응답이 1MB 제한을 초과했습니다."); }
}

/** Read and measure one upstream response; never evaluates the returned scripts. */
export async function observeResponse(
  response: Response,
  options: { framework: FrameworkId; request: ObserverRequest; fixture: DashboardData; startedAt: number; responseStartMs: number; signal: AbortSignal; now?: () => number },
): Promise<{ metrics: ObserverMetrics; html: string | null; valid: boolean }> {
  const now = options.now ?? (() => performance.now());
  const elapsed = () => Math.max(0, now() - options.startedAt);
  const parser = new DashboardHtmlParser(options.framework, options.request, options.fixture);
  const decoder = new TextDecoder();
  const reader = response.body?.getReader();
  let firstByteMs: number | null = null;
  let htmlBytes = 0;
  const abort = () => { void reader?.cancel(options.signal.reason).catch(() => {}); };
  options.signal.addEventListener("abort", abort, { once: true });

  try {
    options.signal.throwIfAborted();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        options.signal.throwIfAborted();
        if (done) break;
        if (value.byteLength === 0) continue;
        const receivedAt = elapsed();
        firstByteMs ??= receivedAt;
        htmlBytes += value.byteLength;
        if (htmlBytes > MAX_HTML_BYTES) throw new ObservationLimitError();
        parser.push(decoder.decode(value, { stream: true }), receivedAt);
      }
    }
    parser.push(decoder.decode(), elapsed());
    const result = parser.finish();
    return {
      ...result,
      metrics: {
        responseStartMs: round(options.responseStartMs),
        firstByteMs: firstByteMs === null ? null : round(firstByteMs),
        contentReadyMs: result.contentReadyMs === null ? null : round(result.contentReadyMs),
        totalMs: round(elapsed()),
        htmlBytes,
      },
    };
  } finally {
    options.signal.removeEventListener("abort", abort);
    // Cancel on success, timeout, size failure, parser failure, and client disconnect.
    try { await reader?.cancel(); } catch { /* An aborted fetch may already have released its body. */ }
    reader?.releaseLock();
  }
}

function round(value: number): number { return Math.round(value * 100) / 100; }
