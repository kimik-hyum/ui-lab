import { createError, defineEventHandler, getQuery, setResponseHeader } from 'h3';
import { getDashboardSsr } from '../../utils/scenarios/dashboard-ssr';
import type { DashboardSsrResponse } from '../../../shared/scenarios/dashboard-ssr/types';

export default defineEventHandler(async (event): Promise<DashboardSsrResponse> => {
  setResponseHeader(event, 'cache-control', 'no-store');
  const scenario = await getDashboardSsr(getQuery(event));
  if (!scenario) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Team Not Found',
      message: '팀을 찾을 수 없습니다.',
    });
  }
  return scenario;
});
