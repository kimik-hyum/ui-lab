import "server-only";
import nextPackage from "next/package.json";
import routerPackage from "react-router/package.json";
import nuxtPackage from "nuxt/package.json";
import kitPackage from "../../../../../sveltekit-lab/node_modules/@sveltejs/kit/package.json";
import type { FrameworkId, ObserverSource } from "./types";

const targets: Record<FrameworkId, { label: string; version: string; origin: string; environmentKey: string }> = {
  next: { label: "Next.js", version: nextPackage.version, origin: "http://127.0.0.1:3001", environmentKey: "UI_LAB_SSR_NEXT_ORIGIN" },
  "react-router": { label: "React Router", version: routerPackage.version, origin: "http://127.0.0.1:3005", environmentKey: "UI_LAB_SSR_REACT_ROUTER_ORIGIN" },
  sveltekit: { label: "SvelteKit", version: kitPackage.version, origin: "http://127.0.0.1:3002", environmentKey: "UI_LAB_SSR_SVELTEKIT_ORIGIN" },
  nuxt: { label: "Nuxt", version: nuxtPackage.version, origin: "http://127.0.0.1:3004", environmentKey: "UI_LAB_SSR_NUXT_ORIGIN" },
};

export function getObserverTarget(framework: FrameworkId): { origin: string; source: ObserverSource } {
  const target = targets[framework];
  const origin = new URL(process.env[target.environmentKey] ?? target.origin);
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) {
    throw new Error("SSR observer origin must be an HTTP(S) origin without credentials or paths.");
  }
  return {
    origin: origin.origin,
    source: {
      label: target.label,
      // These versions come from installed package metadata in this build, not semver ranges.
      version: target.version,
      path: "/scenarios/dashboard-ssr",
      renderMode: "blocking",
    },
  };
}
