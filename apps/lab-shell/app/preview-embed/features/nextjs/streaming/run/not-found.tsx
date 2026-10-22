import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <main className="min-h-screen bg-[#181816] p-6 font-sans text-[#e8e6df]">
      <h1 className="text-xl font-semibold">요청한 대시보드가 없습니다.</h1>
      <p className="mt-3 text-sm leading-6 text-[#aaa89f]">이 실험에서는 workspace 데이터와 blocking · streaming 모드를 제공합니다.</p>
      <Link href="/front-feature/nextjs/streaming" target="_top" prefetch={false} className="mt-5 inline-block text-sm text-[#ced8bb] underline underline-offset-4">비교 화면으로 돌아가기</Link>
    </main>
  );
}
