import type { ReactNode } from "react";
import type { DashboardDelay, DashboardMode } from "../types";

export default function DashboardShell({
  mode,
  delay,
  children,
}: {
  mode: DashboardMode;
  delay: DashboardDelay;
  children: ReactNode;
}) {
  return (
    <main
      data-stream-stage="shell"
      data-stream-mode={mode}
      className="min-h-screen bg-[#181816] p-5 font-sans text-[#e8e6df] sm:p-6"
    >
      <header className="mb-6 border-b border-[#3b3b35] pb-5">
        <p className="mb-2 text-xs tracking-wide text-[#aaa89f]">팀 워크스페이스 · 고정 예시 데이터</p>
        <h1 className="text-2xl font-semibold tracking-tight">오늘의 작업</h1>
        <p className="mt-2 text-sm leading-6 text-[#aaa89f]">
          {mode === "streaming" ? "헤더 먼저, 준비된 영역부터 표시합니다." : "모든 데이터가 준비된 뒤 함께 표시합니다."}
        </p>
        <p className="mt-3 text-xs leading-5 text-[#aaa89f]">
          서버 인공지연: 요약 {delay.summaryMs}ms · 활동 {delay.activityMs}ms
        </p>
      </header>
      <section aria-label="대시보드 데이터" className="space-y-6">{children}</section>
      <footer className="mt-6 border-t border-[#3b3b35] pt-4 text-xs leading-5 text-[#aaa89f]">
        실제 Next.js 서버 응답입니다. 숫자는 고정 작업 데이터이며 성능 측정값이 아닙니다.
      </footer>
    </main>
  );
}
