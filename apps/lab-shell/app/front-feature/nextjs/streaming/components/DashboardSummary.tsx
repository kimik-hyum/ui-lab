import type { DashboardSummary as SummaryData } from "../types";

export default function DashboardSummary({ data }: { data: SummaryData }) {
  return (
    <section data-stream-stage="summary" aria-label="작업 요약" className="min-h-40">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">작업 요약</h2>
        <span className="text-xs text-[#ced8bb]">서버 데이터 도착</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {data.map((item) => (
          <article key={item.label} className="rounded-lg border border-[#3b3b35] bg-[#22221f] p-3">
            <p className="text-xs text-[#aaa89f]">{item.label}</p>
            <strong className="my-2 block text-3xl font-medium">{item.value}</strong>
            <p className="text-xs leading-5 text-[#aaa89f]">{item.caption}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
