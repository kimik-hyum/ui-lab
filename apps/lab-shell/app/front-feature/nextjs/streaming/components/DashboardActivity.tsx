import type { DashboardActivity as ActivityData } from "../types";

export default function DashboardActivity({ data }: { data: ActivityData }) {
  return (
    <section data-stream-stage="activity" aria-label="최근 활동" className="min-h-60">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">최근 활동</h2>
        <span className="text-xs text-[#ced8bb]">서버 데이터 도착</span>
      </div>
      <ul className="divide-y divide-[#3b3b35] overflow-hidden rounded-lg border border-[#3b3b35] bg-[#22221f]">
        {data.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 p-4">
            <div>
              <p className="mb-1 text-xs text-[#aaa89f]">{item.project}</p>
              <p className="text-sm leading-5">{item.title}</p>
            </div>
            <span className="shrink-0 rounded bg-[#2c3027] px-2 py-1 text-xs text-[#ced8bb]">{item.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
