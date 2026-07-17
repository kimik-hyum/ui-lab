"use client";

import Link from "next/link";

type ShoppingDetailSsrErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ShoppingDetailSsrError({
  error,
  reset,
}: ShoppingDetailSsrErrorProps) {
  return (
    <main>
      <h1>Scenario: Shopping Detail SSR</h1>
      <section className="card" aria-labelledby="shopping-detail-ssr-error">
        <h2 id="shopping-detail-ssr-error">상품 상세를 불러오지 못했습니다.</h2>
        <p>{error.message || "서버에서 상품 데이터를 가져오는 중 오류가 발생했습니다."}</p>
        <p>
          <button type="button" onClick={() => reset()}>
            다시 시도
          </button>
        </p>
      </section>
      <p>
        <Link href="/">홈으로 이동</Link>
      </p>
    </main>
  );
}
