"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

export default function UpgradePreviewError({ reset }: { reset: () => void }) {
  const router = useRouter();
  const retry = () => startTransition(() => {
    router.refresh();
    reset();
  });

  return (
    <section role="alert" className="p-6 text-sm text-slate-600">
      <h2 className="font-semibold text-slate-800">버전업 기록을 불러오지 못했습니다.</h2>
      <p className="mt-2">잠시 후 다시 시도해주세요.</p>
      <button type="button" onClick={retry} className="mt-4 min-h-11 rounded-lg border border-slate-300 px-4 text-violet-600">다시 시도</button>
    </section>
  );
}
