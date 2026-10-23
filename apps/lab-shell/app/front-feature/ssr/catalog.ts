import type { FeatureCatalogSection } from "../components/FeatureCatalogTypes";

export const SSR_SECTIONS: FeatureCatalogSection[] = [{
  id: "server-rendering",
  title: "서버 로딩과 렌더링",
  subtitle: "동일한 데이터로 실행 결과와 구현 코드를 비교합니다.",
  features: [
    {
      id: "data-loading", title: "순차 요청과 병렬 요청",
      description: "동일한 서버 데이터를 준비하는 순서와 콘텐츠 도착을 비교합니다.",
      badge: "Data loading", since: "Next.js App Router", status: "available",
      href: "/ssr-lab/data-loading",
    },
    {
      id: "framework-dashboard", title: "프레임워크별 서버 HTML",
      description: "같은 대시보드를 네 프레임워크의 서버 로딩 방식으로 비교합니다.",
      badge: "SSR", since: "Next · Nuxt · SvelteKit · React Router", status: "available",
      href: "/ssr-lab/framework-dashboard",
    },
  ],
}];
