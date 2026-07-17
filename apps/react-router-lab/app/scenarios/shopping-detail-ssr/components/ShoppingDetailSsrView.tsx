import { Link } from "react-router";
import type { ShoppingDetailSsrLoaderData } from "../lib/shopping-detail-ssr-types";

type ShoppingDetailSsrViewProps = {
  data: ShoppingDetailSsrLoaderData;
};

export default function ShoppingDetailSsrView({ data }: ShoppingDetailSsrViewProps) {
  const { product } = data;

  return (
    <main>
      <h1>Scenario: Shopping Detail SSR</h1>
      <p>
        React Router loader가 <code>.server.ts</code> helper를 통해 Supabase를 직접 조회합니다.
      </p>

      <section className="card" aria-labelledby="shopping-detail-ssr-product">
        <img
          src={product.image_url}
          alt={product.name}
          width={product.image_width}
          height={product.image_height}
        />

        <h2 id="shopping-detail-ssr-product">{product.name}</h2>
        <p>{product.description}</p>

        <table>
          <tbody>
            <tr>
              <th scope="row">브랜드</th>
              <td>{product.brand}</td>
            </tr>
            <tr>
              <th scope="row">가격</th>
              <td>{formatPrice(product.price, product.currency)}</td>
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
              <td>{formatDateTime(product.created_at)}</td>
            </tr>
            <tr>
              <th scope="row">데이터 경계</th>
              <td>{data.source}</td>
            </tr>
            <tr>
              <th scope="row">요청 slug</th>
              <td>{data.requestedSlug}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <p>
        <Link to="/">홈으로 이동</Link>
      </p>
    </main>
  );
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}
