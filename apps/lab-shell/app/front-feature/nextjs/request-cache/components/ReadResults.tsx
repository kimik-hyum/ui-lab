import type { ReadMode, ReadPattern, TeamRead } from "../types";

export function ReadResults({ mode, pattern, records }: {
  mode: ReadMode;
  pattern: ReadPattern;
  records: TeamRead[];
}) {
  const uniqueCount = new Set(records.map((record) => record.executionId)).size;
  return (
    <main data-request-cache="v1" data-request-cache-mode={mode} data-pattern={pattern} className="min-w-0 space-y-4 p-4 text-slate-800">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-base font-semibold">{mode === "direct" ? "일반 서버 함수" : "React cache()"}</h1>
        <p className="text-sm text-slate-600">
          서로 다른 실행 ID <strong data-unique-count={uniqueCount} className="text-xl text-violet-600">{uniqueCount}개</strong>
        </p>
      </div>
      <ol className="space-y-3">
        {records.map((record, index) => (
          <li key={index} data-team={record.team} data-execution-id={record.executionId} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <h2 className="text-sm font-semibold">카드 {index + 1} · {record.name}</h2>
              <span className="text-xs text-slate-500">진행 중 {record.tasks}개</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">서버 함수 실행 ID</p>
            <code className="mt-1 block break-all text-xs leading-5 text-slate-700">{record.executionId}</code>
          </li>
        ))}
      </ol>
      <p data-request-cache-ready="v1" className="text-xs leading-5 text-slate-500">
        이 응답의 카드 3개가 받은 ID를 셉니다. 같은 ID는 같은 반환 결과를 사용했다는 뜻입니다.
      </p>
    </main>
  );
}
