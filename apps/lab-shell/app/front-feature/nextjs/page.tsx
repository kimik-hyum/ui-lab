import { FeatureCatalog } from "../components/FeatureCatalog";
import type { FeatureCatalogSection } from "../components/FeatureCatalogTypes";

const NEXTJS_VERSION_SECTIONS: FeatureCatalogSection[] = [
  {
    id: "next-15",
    title: "Next.js 15+",
    subtitle: "App Router 중심 런타임/데이터 패턴",
    features: [
      {
        id: "rsc-vs-csc",
        title: "RSC vs CSC 렌더링 비교",
        description:
          "동일한 아티클 뷰어를 Server Component(서버 프리렌더)와 Client Component(클라이언트 fetch)로 구현해 번들 크기·네트워크 요청·로딩 UX 차이를 체감합니다.",
        badge: "server components",
        since: "since Next.js 13 App Router",
        status: "available",
        href: "/front-feature/nextjs/rsc-vs-csc",
      },
      {
        id: "server-actions",
        title: "Server Actions",
        description: "폼 처리와 서버 뮤테이션 흐름 비교 시나리오를 준비 중입니다.",
        badge: "server actions",
        since: "since Next.js 13.4+",
        status: "planned",
      },
      {
        id: "partial-prerendering",
        title: "Partial Prerendering",
        description: "동적 영역과 정적 영역을 혼합하는 렌더링 전략 비교를 추가할 예정입니다.",
        badge: "PPR",
        since: "since Next.js 14+",
        status: "planned",
      },
    ],
  },
  {
    id: "next-13-14",
    title: "Next.js 13-14",
    subtitle: "App Router 전환기 핵심 개념",
    features: [
      {
        id: "routing-patterns",
        title: "Routing Patterns",
        description: "Pages Router 대비 App Router 구조 변화 비교를 준비 중입니다.",
        badge: "app router",
        since: "since Next.js 13",
        status: "planned",
      },
      {
        id: "streaming-suspense",
        title: "Streaming + Suspense",
        description: "SSR/Streaming UX 차이를 다루는 예제를 추가할 예정입니다.",
        badge: "streaming",
        since: "since Next.js 13",
        status: "planned",
      },
    ],
  },
];

export default function NextJSFeaturesPage() {
  return (
    <FeatureCatalog
      title="Next.js 기능 비교"
      description="서버와 클라이언트의 역할부터 데이터 로딩까지. 같은 화면을 만드는 서로 다른 구현을 비교하세요."
      sections={NEXTJS_VERSION_SECTIONS}
    />
  );
}
