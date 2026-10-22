"use client";

import "../../../../../fixtures/dashboard-ssr.css";

export default function DashboardSsrError({ retry }: { retry: () => void }) {
  return (
    <main className="ssr-dashboard">
      <h1>작업 현황을 불러오지 못했습니다.</h1>
      <p>서버 응답 중 오류가 발생했습니다. 다시 시도해 주세요.</p>
      <button type="button" onClick={retry}>다시 시도</button>
    </main>
  );
}
