import type { TaskResult } from "../server/data";

export function DataLoadingResult({ mode, tasks, delayMs }: {
  mode: "sequential" | "parallel";
  tasks: TaskResult[];
  delayMs: number;
}) {
  // [cmp:timing:start]
  const elapsed = Math.max(...tasks.map((task) => task.finishedMs));
  const scale = Math.max(delayMs * 2, elapsed);
  // [cmp:timing:end]
  return (
    <main className="min-h-screen bg-[#181816] p-5 text-[#e8e6df]" data-loading-mode={mode}>
      <p className="text-xs text-[#b8c5a1]">서버에서 완성된 HTML · {mode === "parallel" ? "동시에 시작" : "하나씩 시작"}</p>
      <h1 className="mt-2 text-xl font-semibold">팀 대시보드</h1>
      <p className="mt-3 text-sm text-[#aaa89f]">서버 작업 완료까지 <strong className="text-[#e8e6df]" data-server-elapsed={elapsed}>{elapsed}ms</strong></p>
      <div className="mt-5 space-y-4" aria-label="서버 작업 타임라인">
        {tasks.map((task) => (
          <section
            key={task.name}
            className="rounded-lg border border-[#3b3b35] bg-[#22221f] p-4"
            data-task={task.name}
            data-task-start={task.startedMs}
            data-task-end={task.finishedMs}
          >
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <h2>{task.name}</h2>
              <span className="text-xs text-[#aaa89f]">{task.startedMs}–{task.finishedMs}ms</span>
            </div>
            <p className="mt-2 text-sm text-[#ced8bb]">{task.value}</p>
            {/* [cmp:timing:start] */}
            <div className="mt-4 h-2 overflow-hidden rounded bg-[#34342f]" aria-hidden="true">
              <div
                className="h-full rounded bg-[#a4b98d]"
                style={{
                  marginLeft: `${task.startedMs / scale * 100}%`,
                  width: `${(task.finishedMs - task.startedMs) / scale * 100}%`,
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs tabular-nums text-[#aaa89f]">
              <span>0ms</span>
              <span>{scale}ms</span>
            </div>
            {/* [cmp:timing:end] */}
          </section>
        ))}
      </div>
      <p className="mt-5 text-xs leading-6 text-[#aaa89f]">
        각 작업에 {delayMs}ms의 인공지연을 넣었습니다. 시간은 서버의 두 작업 구간만 기록하며,
        네트워크·첫 화면 표시 시간은 포함하지 않습니다.
      </p>
      <p className="mt-2 text-xs leading-6 text-[#aaa89f]">
        이 패널의 두 막대는 같은 축을 씁니다. 기본 상한은 {delayMs * 2}ms이며,
        실제 작업이 더 늦게 끝나면 종료 시각까지 늘어납니다.
      </p>
    </main>
  );
}
