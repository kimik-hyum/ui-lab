import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import type { Route } from "./+types/scenarios.shopping-detail-ssr";
import ShoppingDetailSsrView from "../scenarios/shopping-detail-ssr/components/ShoppingDetailSsrView";
import {
  getShoppingDetailSsrProduct,
  SHOPPING_DETAIL_SSR_DEFAULT_SLUG,
} from "../scenarios/shopping-detail-ssr/lib/shopping-detail-ssr-data.server";
import type { ShoppingDetailSsrLoaderData } from "../scenarios/shopping-detail-ssr/lib/shopping-detail-ssr-types";

export function meta({ data }: Route.MetaArgs) {
  return [
    {
      title: data?.product
        ? `${data.product.name} | React Router Shopping Detail SSR`
        : "Shopping Detail SSR | React Router Lab",
    },
    {
      name: "description",
      content: "React Router v7 loader direct Supabase SSR shopping detail scenario",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const slug = resolveProductSlug(url.searchParams.get("slug"));
  const product = await getShoppingDetailSsrProduct(slug);

  if (!product) {
    throw new Response(`상품을 찾을 수 없습니다: ${slug}`, { status: 404 });
  }

  return {
    product,
    requestedSlug: slug,
    source: "react-router-loader-direct-supabase",
  } satisfies ShoppingDetailSsrLoaderData;
}

export default function ShoppingDetailSsrRoute({ loaderData }: Route.ComponentProps) {
  return <ShoppingDetailSsrView data={loaderData} />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <main>
        <h1>Scenario: Shopping Detail SSR</h1>
        <section className="card" aria-labelledby="shopping-detail-ssr-error">
          <h2 id="shopping-detail-ssr-error">
            {error.status === 404 ? "상품을 찾을 수 없습니다." : "상품 조회에 실패했습니다."}
          </h2>
          <p>{error.data || `HTTP ${error.status}`}</p>
        </section>
        <p>
          <Link to="/">홈으로 이동</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Scenario: Shopping Detail SSR</h1>
      <section className="card" aria-labelledby="shopping-detail-ssr-error">
        <h2 id="shopping-detail-ssr-error">서버 렌더링 중 오류가 발생했습니다.</h2>
        <p>{error instanceof Error ? error.message : "알 수 없는 오류입니다."}</p>
      </section>
      <p>
        <Link to="/">홈으로 이동</Link>
      </p>
    </main>
  );
}

function resolveProductSlug(slug: string | null) {
  const trimmedSlug = slug?.trim();

  return trimmedSlug || SHOPPING_DETAIL_SSR_DEFAULT_SLUG;
}
