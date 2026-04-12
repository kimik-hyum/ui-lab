export default function ReportsPage() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center text-center px-8">
      <div>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xl">
          📋
        </div>
        <h2 className="text-sm font-semibold text-slate-700 mb-1">리포트를 선택하세요</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          왼쪽 목록에서 분석 리포트를 선택하면<br />여기에 내용이 표시됩니다.
        </p>
      </div>
    </div>
  );
}
