import Link from "next/link";

export default function UpgradePreviewNotFound() {
  return (
    <section className="p-6 text-sm text-slate-600">
      <h2 className="font-semibold text-slate-800">이 버전업 기록을 찾을 수 없습니다.</h2>
      <p className="mt-2">목록에서 현재 기록을 확인해주세요.</p>
      <Link href="/upgrade-logs" className="mt-4 inline-flex min-h-11 items-center text-violet-600 underline">로그 목록으로</Link>
    </section>
  );
}
