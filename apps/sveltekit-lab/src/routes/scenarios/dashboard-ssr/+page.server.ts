import { error } from '@sveltejs/kit';
import { getDashboardSsr } from '#lib/server/scenarios/dashboard-ssr.ts';
import type { PageServerLoad } from './$types';

// [cmp:boundary:start]
export const prerender = false;

export const load: PageServerLoad = async ({ url, setHeaders }) => {
  setHeaders({ 'cache-control': 'no-store' });
  // [cmp:boundary:end]

  // [cmp:loading:start]
  // Promise를 데이터로 넘기지 않고, 결과를 기다린 뒤 렌더링하는 blocking SSR입니다.
  const { dashboard, delayMs } = await getDashboardSsr(url.searchParams);
  if (!dashboard) error(404, '팀을 찾을 수 없습니다.');
  return { dashboard, delayMs };
  // [cmp:loading:end]
};
