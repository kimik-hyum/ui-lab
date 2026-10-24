export default function DashboardFallback({ section }: { section: "summary" | "activity" }) {
  const isSummary = section === "summary";

  return (
    <section
      data-stream-pending={section}
      role="status"
      aria-label={`${isSummary ? "작업 요약" : "최근 활동"} 서버 데이터 대기 중`}
      className={isSummary ? "min-h-40" : "min-h-60"}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{isSummary ? "작업 요약" : "최근 활동"}</h2>
        <span className="text-xs text-[#d9bc83]">서버 응답 대기</span>
      </div>
      <div className={isSummary ? "grid grid-cols-3 gap-2 sm:gap-3" : "space-y-3"} aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className={`rounded-lg border border-[#3b3b35] bg-[#22221f] p-3 ${isSummary ? "h-32" : "h-16"}`}
          >
            <div className="h-2 w-1/2 rounded bg-[#3b3b35]" />
            <div className="mt-3 h-3 w-3/4 rounded bg-[#34342f]" />
          </div>
        ))}
      </div>
    </section>
  );
}
