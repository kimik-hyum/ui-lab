import "server-only";

export type TaskResult = {
  name: string;
  value: string;
  startedMs: number;
  finishedMs: number;
};

export type LoadingOptions = { delayMs: number; startedAt: number };

// [cmp:timing:start]
export function createLoadingOptions(delayMs: number): LoadingOptions {
  return { delayMs, startedAt: performance.now() };
}
// [cmp:timing:end]

// 독립된 서버 I/O를 인공지연으로 재현하며, 프레임워크 성능 순위를 뜻하지 않습니다.
async function readFixture(name: string, value: string, options: LoadingOptions): Promise<TaskResult> {
  // [cmp:timing:start]
  const startedMs = Math.round(performance.now() - options.startedAt);
  await new Promise((resolve) => setTimeout(resolve, options.delayMs));
  return { name, value, startedMs, finishedMs: Math.round(performance.now() - options.startedAt) };
  // [cmp:timing:end]
}

export function getSummary(options: LoadingOptions) {
  return readFixture("팀 요약", "진행 중인 작업 8개", options);
}

export function getActivity(options: LoadingOptions) {
  return readFixture("최근 활동", "검토 대기 중인 변경 3개", options);
}

export function parseDelay(value: string | string[] | undefined) {
  const delay = Number(value);
  return [400, 800, 1200].includes(delay) ? delay : 800;
}
