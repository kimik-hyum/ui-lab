import { Link } from "react-router";
import type { Route } from "./+types/shop.$slug";
import type { ProductApiResponse } from "../types/product";

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: data ? `${data.product.name} | React Router Lab` : "React Router Lab" },
    { name: "description", content: "React Router Framework Mode SSR shopping detail" },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const slug = params.slug;

  if (!slug) {
    throw new Response("상품 slug가 필요합니다.", { status: 400 });
  }

  const url = new URL(request.url);
  const response = await fetch(`${url.origin}/api/products/${slug}`);

  if (response.status === 404) {
    throw new Response("상품을 찾을 수 없습니다.", { status: 404 });
  }

  if (!response.ok) {
    throw new Response("상품 조회에 실패했습니다.", { status: response.status });
  }

  return (await response.json()) as ProductApiResponse;
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ShopProductDetailPage({ loaderData }: Route.ComponentProps) {
  const { product } = loaderData;

  return (
    <main>
      <h1>Scenario: Shopping Detail (React Router SSR)</h1>
      <p>
        API: <code>/api/products/{product.slug}</code>
      </p>

      <section className="card">
        <img
          src={product.image_url}
          alt={product.name}
          width={product.image_width}
          height={product.image_height}
        />

        <h2>{product.name}</h2>
        <p>{product.description}</p>

        <table>
          <tbody>
            <tr>
              <th>브랜드</th>
              <td>{product.brand}</td>
            </tr>
            <tr>
              <th>가격</th>
              <td>{formatPrice(product.price, product.currency)}</td>
            </tr>
            <tr>
              <th>재고</th>
              <td>{product.stock}</td>
            </tr>
            <tr>
              <th>평점</th>
              <td>{product.rating}</td>
            </tr>
            <tr>
              <th>생성일</th>
              <td>{new Date(product.created_at).toLocaleString("ko-KR")}</td>
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
