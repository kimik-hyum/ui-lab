import type { DashboardDelay } from "./types";

export const DASHBOARD_DELAY_OPTIONS = [
  { summaryMs: 500, activityMs: 1200 },
  { summaryMs: 1000, activityMs: 2200 },
  { summaryMs: 2000, activityMs: 4200 },
] satisfies DashboardDelay[];

export const DEFAULT_DASHBOARD_DELAY = DASHBOARD_DELAY_OPTIONS[1];

export function resolveDashboardDelay(value: string | string[] | undefined): DashboardDelay {
  return DASHBOARD_DELAY_OPTIONS.find((option) => String(option.summaryMs) === value)
    ?? DEFAULT_DASHBOARD_DELAY;
}
