import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/products/:slug", "routes/api.products.$slug.ts"),
  route("shop/:slug", "routes/shop.$slug.tsx"),
] satisfies RouteConfig;
