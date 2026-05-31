import { error } from '@sveltejs/kit';
import { getShoppingDetailSsrProduct } from '$lib/server/scenarios/shopping-detail-ssr';
import type { PageServerLoad } from './$types';

const DEFAULT_PRODUCT_SLUG = 'wireless-headphones-x1';

const getScenarioSlug = (value: string | null) => {
  const slug = value?.trim();
  return slug || DEFAULT_PRODUCT_SLUG;
};

export const load: PageServerLoad = async ({ url }) => {
  const requestedSlug = getScenarioSlug(url.searchParams.get('slug'));
  const product = await getShoppingDetailSsrProduct(requestedSlug);

  if (!product) {
    throw error(404, `상품을 찾을 수 없습니다: ${requestedSlug}`);
  }

  return {
    product,
    requestedSlug,
    source: 'sveltekit-page-server-direct-helper'
  };
};
