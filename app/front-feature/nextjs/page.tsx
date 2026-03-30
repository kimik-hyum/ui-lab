import { FeatureCatalog, FeatureCatalogSection } from "../components/FeatureCatalog";

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
      title="Next.js Feature Catalog"
      description="Next.js 버전별 기능을 같은 카드 패턴으로 정리해 React 섹션과 탐색 경험을 통일합니다."
      sections={NEXTJS_VERSION_SECTIONS}
    />
  );
}
