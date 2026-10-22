import type { Article } from "./article";

export const ARTICLE_REQUEST_TIMEOUT_MS = 15_000;

export type ArticleRequestResult =
  | { kind: "success"; article: Article }
  | { kind: "error"; message: string };

export async function requestArticle(
  delay: number,
  run: number,
  lifecycle: AbortSignal,
  { fetchImpl = fetch, timeoutMs = ARTICLE_REQUEST_TIMEOUT_MS }: {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
  } = {},
): Promise<ArticleRequestResult | null> {
  if (lifecycle.aborted) return null;

  // [cmp:loading-state:start]
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  lifecycle.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  // [cmp:loading-state:end]

  try {
    // [cmp:data-fetching:start]
    const response = await fetchImpl(`/api/rsc-demo?delay=${delay}&run=${run}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const article: Article = await response.json();
    // [cmp:data-fetching:end]
    // [cmp:loading-state:start]
    if (lifecycle.aborted) return null;
    if (timedOut) throw new Error("Request timed out");
    return { kind: "success", article };
  } catch (error) {
    // 조건 변경·화면 이동으로 취소한 요청에는 오류를 표시하지 않습니다.
    if (lifecycle.aborted) return null;
    controller.abort();
    return {
      kind: "error",
      message: timedOut
        ? "15초 안에 JSON 수신을 완료하지 못했습니다."
        : error instanceof Error ? error.message : "요청을 완료하지 못했습니다.",
    };
  } finally {
    clearTimeout(timeout);
    lifecycle.removeEventListener("abort", cancel);
  }
  // [cmp:loading-state:end]
}
