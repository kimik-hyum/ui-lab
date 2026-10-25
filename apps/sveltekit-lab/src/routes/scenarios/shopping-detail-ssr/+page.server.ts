import { getShoppingDetailSsrProduct } from '#lib/server/scenarios/shopping-detail-ssr.ts';
import type { PageServerLoad } from './$types';

const DEFAULT_PRODUCT_SLUG = 'wireless-headphones-x1';

const getScenarioSlug = (value: string | null) => {
  const slug = value?.trim();
  return slug || DEFAULT_PRODUCT_SLUG;
};

export const load: PageServerLoad = ({ url }) => {
  const requestedSlug = getScenarioSlug(url.searchParams.get('slug'));
  const product = getShoppingDetailSsrProduct(requestedSlug);
  // The database helper does not use SvelteKit fetch; acknowledge early rejections.
  void product.catch(() => {});

  return {
    product,
    requestedSlug,
    source: 'sveltekit-page-server-direct-helper'
  };
};
