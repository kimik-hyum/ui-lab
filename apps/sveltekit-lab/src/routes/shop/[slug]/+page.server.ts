import { error as svelteError } from '@sveltejs/kit';
import type { ProductRow } from '$lib/server/supabase';

type ProductApiResponse = {
  product: ProductRow;
};

export const load = async ({ fetch, params }) => {
  const response = await fetch(`/api/products/${params.slug}`);

  if (response.status === 404) {
    throw svelteError(404, '상품을 찾을 수 없습니다.');
  }

  if (!response.ok) {
    throw svelteError(response.status, '상품 조회에 실패했습니다.');
  }

  const payload = (await response.json()) as ProductApiResponse;

  return {
    product: payload.product
  };
};
