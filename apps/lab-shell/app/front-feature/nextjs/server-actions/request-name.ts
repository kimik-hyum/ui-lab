import { transportFailure } from "./state";
import type { VerificationState } from "./types";

export async function requestName(
  input: string,
  lifecycle: AbortSignal,
  { fetchImpl = fetch, timeoutMs = 15_000 }: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<VerificationState | null> {
  if (lifecycle.aborted) return null;
  // [cmp:pending-error:start]
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  lifecycle.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  // [cmp:pending-error:end]
  try {
    // [cmp:transport:start]
    const response = await fetchImpl("/api/server-action-demo", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: input }), cache: "no-store", signal: controller.signal,
    });
    if (!response.ok && response.status !== 422) throw new Error(`HTTP ${response.status}`);
    const result: VerificationState = await response.json();
    // [cmp:transport:end]
    // [cmp:pending-error:start]
    if (lifecycle.aborted) return null;
    if (timedOut) return transportFailure(input, "15초 안에 응답을 받지 못했습니다. 다시 시도해주세요.");
    return result;
  } catch {
    if (lifecycle.aborted) return null;
    controller.abort();
    return transportFailure(input, timedOut ? "15초 안에 응답을 받지 못했습니다. 다시 시도해주세요." : undefined);
  } finally {
    clearTimeout(timeout);
    lifecycle.removeEventListener("abort", cancel);
  }
  // [cmp:pending-error:end]
}
