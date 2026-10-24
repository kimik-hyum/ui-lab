"use client";

export default function DashboardError({ retry }: { retry: () => void }) {
  return (
    <main className="min-h-screen bg-[#181816] p-6 font-sans text-[#e8e6df]">
      <h1 className="text-xl font-semibold">대시보드를 불러오지 못했습니다.</h1>
      <p className="mt-3 text-sm leading-6 text-[#aaa89f]">서버 응답 중 오류가 발생했습니다. 같은 요청을 다시 시도할 수 있습니다.</p>
      <button type="button" onClick={retry} className="mt-5 rounded-lg border border-[#56624a] bg-[#293025] px-4 py-2 text-sm text-[#ced8bb]">다시 시도</button>
    </main>
  );
}
