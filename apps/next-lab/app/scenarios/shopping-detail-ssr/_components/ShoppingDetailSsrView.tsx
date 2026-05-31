import Link from "next/link";
import type { ShoppingDetailSsrViewModel } from "../_lib/shopping-detail-ssr-data";

type ShoppingDetailSsrViewProps = {
  viewModel: ShoppingDetailSsrViewModel;
};

export default function ShoppingDetailSsrView({
  viewModel,
}: ShoppingDetailSsrViewProps) {
  const { product, formattedPrice, formattedCreatedAt, sourceLabel } = viewModel;

  return (
    <main>
      <p style={{ margin: "0 0 0.5rem", color: "#475569" }}>
        Harness scenario / Next.js App Router
      </p>
      <h1>Scenario: Shopping Detail SSR (Next.js)</h1>
      <p>
        SSR helper: <code>{sourceLabel}</code>
      </p>

      <section className="card" aria-labelledby="shopping-detail-title">
        {/* 비교 실험 공정성을 위해 next/image 대신 표준 img를 사용합니다. */}
        <img
          src={product.image_url}
          alt={product.name}
          width={product.image_width}
          height={product.image_height}
        />

        <h2 id="shopping-detail-title">{product.name}</h2>
        <p>{product.description}</p>

        <table>
          <tbody>
            <tr>
              <th scope="row">브랜드</th>
              <td>{product.brand}</td>
            </tr>
            <tr>
              <th scope="row">가격</th>
              <td>{formattedPrice}</td>
            </tr>
            <tr>
              <th scope="row">재고</th>
              <td>{product.stock}</td>
            </tr>
            <tr>
              <th scope="row">평점</th>
              <td>{product.rating}</td>
            </tr>
            <tr>
              <th scope="row">생성일</th>
              <td>{formattedCreatedAt}</td>
            </tr>
            <tr>
              <th scope="row">Slug</th>
              <td>{product.slug}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <p style={{ marginTop: "1rem" }}>
        <Link href="/">홈으로 이동</Link>
      </p>
    </main>
  );
}
