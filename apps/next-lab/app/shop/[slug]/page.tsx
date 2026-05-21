import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ProductApiResponse, ProductRow } from "@ui-lab/api-types";

async function resolveBaseUrl() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://127.0.0.1:3001";
  }

  return `${protocol}://${host}`;
}

async function loadProduct(slug: string): Promise<ProductRow> {
  const baseUrl = await resolveBaseUrl();
  const response = await fetch(`${baseUrl}/api/products/${slug}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error(`상품 조회 실패: ${response.status}`);
  }

  const payload = (await response.json()) as ProductApiResponse;
  return payload.product;
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ShopProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await loadProduct(slug);

  return (
    <main>
      <h1>Scenario: Shopping Detail (Next.js SSR)</h1>
      <p>
        API: <code>/api/products/{product.slug}</code>
      </p>

      <section className="card">
        {/* 비교 실험 공정성을 위해 next/image 대신 표준 img를 사용 */}
        <img
          src={product.image_url}
          alt={product.name}
          width={product.image_width}
          height={product.image_height}
          style={{ width: "100%", height: "auto", borderRadius: "8px" }}
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
        <Link href="/">홈으로 이동</Link>
      </p>
    </main>
  );
}
