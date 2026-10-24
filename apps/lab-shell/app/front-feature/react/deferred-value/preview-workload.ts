import type { PreviewWorkload } from "./types";

// 실제 업무 성능 측정이 아닌, 느린 행 렌더링을 재현하는 시연용 작업입니다.
export function runPreviewWork(text: string, workload: PreviewWorkload): void {
  if (typeof window === "undefined" || text.length === 0 || workload !== "1.5") return;

  // 한 행 안에서만 수행합니다. React가 행과 행 사이에서 입력에 양보할 수 있습니다.
  const startedAt = performance.now();
  while (performance.now() - startedAt < 1.5) {
    // 행별 작업의 목표 시간이며, 실측 렌더 시간이나 고정 갱신 지연이 아닙니다.
  }
}
