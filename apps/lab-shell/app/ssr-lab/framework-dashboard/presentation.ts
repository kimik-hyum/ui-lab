import type { FrameworkId, ObserverResponse } from "./_lib/types";

export const FRAMEWORK_PRESENTATION: Record<FrameworkId, {
  label: string;
  boundary: string;
  dataPath: string;
  docs: string;
  errorDocs: string;
}> = {
  next: {
    label: "Next.js", boundary: "async Server Component",
    dataPath: "서버 페이지에서 데이터 함수를 직접 호출합니다.",
    docs: "https://nextjs.org/docs/app/getting-started/fetching-data",
    errorDocs: "https://nextjs.org/docs/app/api-reference/file-conventions/error",
  },
  "react-router": {
    label: "React Router", boundary: "route loader",
    dataPath: "loader가 데이터를 준비하고 화면은 loaderData를 받습니다.",
    docs: "https://reactrouter.com/start/framework/data-loading",
    errorDocs: "https://reactrouter.com/how-to/error-boundary",
  },
  sveltekit: {
    label: "SvelteKit", boundary: "+page.server.ts의 load",
    dataPath: "서버 load가 데이터를 준비하고 +page.svelte로 전달합니다.",
    docs: "https://svelte.dev/docs/kit/load",
    errorDocs: "https://svelte.dev/docs/kit/errors",
  },
  nuxt: {
    label: "Nuxt", boundary: "await useFetch와 Nitro",
    dataPath: "useFetch가 Nitro handler의 데이터를 기다리고 SSR payload로 전달합니다.",
    docs: "https://nuxt.com/docs/4.x/getting-started/data-fetching",
    errorDocs: "https://nuxt.com/docs/4.x/getting-started/error-handling",
  },
};


export type Observation = { kind: "response"; value: ObserverResponse } | { kind: "network-error"; message: string };
