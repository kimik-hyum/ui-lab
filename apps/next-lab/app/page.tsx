import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Next.js Lab</h1>
      <p>모노레포 비교 실험용 Next.js 앱입니다.</p>
      <p>
        비교 시나리오: <Link href="/scenarios/data-loading">/scenarios/data-loading</Link>
      </p>
      <p>
        쇼핑몰 SSR 상세 시나리오:{" "}
        <Link href="/scenarios/shopping-detail-ssr">
          /scenarios/shopping-detail-ssr
        </Link>
      </p>
    </main>
  );
}
