import { loadDashboardActivity, loadDashboardSummary } from "../dashboard.server";
import type { DashboardDelay } from "../types";
import DashboardActivity from "./DashboardActivity";
import DashboardShell from "./DashboardShell";
import DashboardSummary from "./DashboardSummary";

export default async function BlockingDashboard({ delay }: { delay: DashboardDelay }) {
  // [cmp:parallel-data:start]
  const summaryRequest = loadDashboardSummary(delay.summaryMs);
  const activityRequest = loadDashboardActivity(delay.activityMs);
  // [cmp:parallel-data:end]

  // [cmp:reveal-boundary:start]
  // 두 요청은 병렬로 진행하지만, 페이지는 두 결과를 모두 기다립니다.
  const [summary, activity] = await Promise.all([summaryRequest, activityRequest]);
  // [cmp:reveal-boundary:end]

  // [cmp:loading-ui:start]
  return (
    <DashboardShell mode="blocking" delay={delay}>
      <DashboardSummary data={summary} />
      <DashboardActivity data={activity} />
    </DashboardShell>
  );
  // [cmp:loading-ui:end]
}
