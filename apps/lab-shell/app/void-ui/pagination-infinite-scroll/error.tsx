"use client";

import Link from "next/link";

export default function ProductExperimentError({ reset }: { reset: () => void }) {
  return (
    <main className="workspace-page">
      <section className="mx-auto mt-5 max-w-xl rounded-xl border border-border bg-white p-6 sm:mt-12 sm:p-9" aria-labelledby="product-error-title">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 font-mono text-lg text-amber-800" aria-hidden="true">!</span>
        <p className="mt-6 font-mono text-[10px] tracking-[0.15em] text-muted-foreground">UI PATTERN / DATA UNAVAILABLE</p>
        <h1 id="product-error-title" className="mt-2 text-xl font-semibold tracking-tight text-foreground">상품 실험을 불러오지 못했습니다</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">이 실험은 외부 상품 API인 DummyJSON을 사용합니다. 데이터 요청에 문제가 발생하면 잠시 후 다시 시도해 주세요. 코드 해설은 상품 데이터 없이도 확인할 수 있습니다.</p>
        <div className="mt-7 flex flex-wrap gap-2">
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-xs font-semibold text-white transition-colors hover:bg-accent-hover">다시 시도</button>
          <Link href="/void-ui/pagination-infinite-scroll/hook" className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-xs font-medium text-foreground transition-colors hover:bg-surface">Hook 코드 해설</Link>
          <Link href="/void-ui" className="inline-flex min-h-11 items-center px-3 text-xs font-medium text-muted-foreground hover:text-accent">UI 패턴 목록으로</Link>
        </div>
      </section>
    </main>
  );
}
