import { notFound } from "next/navigation";
import ShoppingDetailSsrView from "./_components/ShoppingDetailSsrView";
import {
  DEFAULT_PRODUCT_SLUG,
  loadShoppingDetailSsrProduct,
  toShoppingDetailSsrViewModel,
} from "./_lib/shopping-detail-ssr-data";

type PageProps = {
  searchParams?: Promise<{
    slug?: string | string[];
  }>;
};

export const metadata = {
  title: "Shopping Detail SSR | Next.js Lab",
};

export const dynamic = "force-dynamic";

function resolveSlug(slug: string | string[] | undefined) {
  const rawSlug = Array.isArray(slug) ? slug[0] : slug;
  const normalizedSlug = rawSlug?.trim();

  return normalizedSlug || DEFAULT_PRODUCT_SLUG;
}

export default async function ShoppingDetailSsrPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = await searchParams;
  const slug = resolveSlug(resolvedSearchParams?.slug);
  // Keep the product outside a loading/Suspense boundary for the blocking SSR comparison.
  const product = await loadShoppingDetailSsrProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <ShoppingDetailSsrView
      viewModel={toShoppingDetailSsrViewModel(product)}
    />
  );
}
