export default defineNuxtConfig({
  compatibilityDate: "2026-05-11",
  css: ["~/assets/css/main.css"],
  nitro: {
    preset: process.env.VERCEL ? "vercel" : "node-server",
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
});
