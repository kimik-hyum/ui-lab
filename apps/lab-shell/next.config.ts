import type { NextConfig } from "next";
import path from "node:path";
import { FRAMEWORK_SOURCE_FILES } from "./app/ssr-lab/framework-dashboard/source-catalog";

const frameworkDashboardSources = [
  "../../fixtures/dashboard-ssr.css",
  ...FRAMEWORK_SOURCE_FILES.map((file) => `../../${file}`),
];
const deferredValueSources = [
  "./app/front-feature/react/deferred-value/components/*.tsx",
  "./app/front-feature/react/deferred-value/preview-workload.ts",
  "./app/front-feature/react/deferred-value/constants.ts",
  "./app/front-feature/react/deferred-value/types.ts",
];
const activitySources = [
  "./app/front-feature/react/activity/components/*.tsx",
  "./app/front-feature/react/activity/activity-stats.ts",
  "./app/front-feature/react/activity/types.ts",
];
const effectEventSources = [
  "./app/front-feature/react/effect-event/components/ReactiveConnection.tsx",
  "./app/front-feature/react/effect-event/components/EffectEventConnection.tsx",
  "./app/front-feature/react/effect-event/connection-source.ts",
];
const rscArticleSources = [
  "./app/front-feature/nextjs/rsc-vs-csc/components/CscArticleViewer.tsx",
  "./app/front-feature/nextjs/rsc-vs-csc/components/RscArticleViewer.tsx",
  "./app/front-feature/nextjs/rsc-vs-csc/request-article.ts",
];
const serverActionSources = [
  "./app/front-feature/nextjs/server-actions/components/ApiNameForm.tsx",
  "./app/front-feature/nextjs/server-actions/components/ServerActionNameForm.tsx",
  "./app/front-feature/nextjs/server-actions/request-name.ts",
  "./app/front-feature/nextjs/server-actions/actions.ts",
  "./app/front-feature/nextjs/server-actions/verify-name.server.ts",
  "./app/api/server-action-demo/route.ts",
];

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "/performance/export": ["../../docs/harness/results/*.md"],
    "/upgrade-logs": ["../../docs/upgrade-logs/*.json"],
    "/upgrade-logs/*": ["../../docs/upgrade-logs/*.json"],
    "/api/upgrade-logs": ["../../docs/upgrade-logs/*.json"],
    "/preview-embed/upgrades/*": ["../../docs/upgrade-logs/*.json"],
    "/ssr-lab/data-loading": ["./app/ssr-lab/data-loading/server/*.tsx"],
    "/preview-embed/ssr/data-loading": ["./app/ssr-lab/data-loading/server/*.tsx"],
    "/ssr-lab/framework-dashboard": frameworkDashboardSources,
    "/preview-embed/ssr/framework-dashboard": frameworkDashboardSources,
    "/front-feature/libraries/virtual-list": ["./app/front-feature/libraries/virtual-list/components/*ListDemo.tsx"],
    "/preview-embed/features/libraries/virtual-list": ["./app/front-feature/libraries/virtual-list/components/*ListDemo.tsx"],
    "/front-feature/libraries/cache": ["./app/front-feature/libraries/cache/components/*Demo.tsx"],
    "/preview-embed/features/libraries/cache": ["./app/front-feature/libraries/cache/components/*Demo.tsx"],
    "/front-feature/react/deferred-value": deferredValueSources,
    "/preview-embed/features/react/deferred-value": deferredValueSources,
    "/front-feature/react/activity": activitySources,
    "/preview-embed/features/react/activity": activitySources,
    "/front-feature/react/effect-event": effectEventSources,
    "/preview-embed/features/react/effect-event": effectEventSources,
    "/front-feature/nextjs/rsc-vs-csc": rscArticleSources,
    "/preview-embed/features/nextjs/rsc-vs-csc": rscArticleSources,
    "/front-feature/nextjs/server-actions": serverActionSources,
    "/preview-embed/features/nextjs/server-actions": serverActionSources,
  },
};

export default nextConfig;
