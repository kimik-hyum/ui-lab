import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("scenarios/shopping-detail-ssr", "routes/scenarios.shopping-detail-ssr.tsx"),
  route("scenarios/dashboard-ssr", "routes/scenarios.dashboard-ssr.tsx"),
] satisfies RouteConfig;
