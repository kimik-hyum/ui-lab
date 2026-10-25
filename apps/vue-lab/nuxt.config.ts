export default defineNuxtConfig({
  compatibilityDate: "2026-05-11",
  css: ["~/assets/css/main.css"],
  experimental: {
    ssrStreaming: true,
  },
  routeRules: {
    "/**": { streaming: false },
    "/scenarios/shopping-detail-ssr": { streaming: true },
  },
  nitro: {
    preset: process.env.VERCEL ? "vercel" : "node-server",
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
});
