import type { DashboardData } from '../../../../../fixtures/dashboard-ssr-types';

export interface DashboardSsrResponse {
  dashboard: DashboardData;
  delayMs: number;
}
