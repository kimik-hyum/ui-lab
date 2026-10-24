import { Suspense } from "react";
import { loadDashboardActivity, loadDashboardSummary } from "../dashboard.server";
import type { DashboardActivity as ActivityData, DashboardDelay, DashboardSummary as SummaryData } from "../types";
import DashboardActivity from "./DashboardActivity";
import DashboardFallback from "./DashboardFallback";
import DashboardShell from "./DashboardShell";
import DashboardSummary from "./DashboardSummary";

// [cmp:reveal-boundary:start]
async function SummaryContent({ request }: { request: Promise<SummaryData> }) {
  return <DashboardSummary data={await request} />;
}

async function ActivityContent({ request }: { request: Promise<ActivityData> }) {
  return <DashboardActivity data={await request} />;
}
// [cmp:reveal-boundary:end]

export default function StreamingDashboard({ delay }: { delay: DashboardDelay }) {
  // [cmp:parallel-data:start]
  const summaryRequest = loadDashboardSummary(delay.summaryMs);
  const activityRequest = loadDashboardActivity(delay.activityMs);
  // [cmp:parallel-data:end]

  // [cmp:loading-ui:start]
  return (
    <DashboardShell mode="streaming" delay={delay}>
      <Suspense fallback={<DashboardFallback section="summary" />}>
        <SummaryContent request={summaryRequest} />
      </Suspense>
      <Suspense fallback={<DashboardFallback section="activity" />}>
        <ActivityContent request={activityRequest} />
      </Suspense>
    </DashboardShell>
  );
  // [cmp:loading-ui:end]
}
