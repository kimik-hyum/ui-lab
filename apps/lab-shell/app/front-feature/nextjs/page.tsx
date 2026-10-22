import { FeatureCatalog, FeatureCatalogSection } from "../components/FeatureCatalog";

const NEXTJS_VERSION_SECTIONS: FeatureCatalogSection[] = [
  {
    id: "next-15",
    title: "Next.js 15+",
    subtitle: "App Router 중심 런타임/데이터 패턴",
    features: [
      {
        id: "rsc-vs-csc",
        title: "클라이언트 요청 vs 서버 데이터 렌더링",
        description:
          "같은 아티클과 서버 인공지연으로 useEffect의 API 요청과 async Server Component의 실제 HTML 응답을 비교합니다. 데이터가 도착하는 경로와 대기 화면을 확인합니다.",
        badge: "server components",
        since: "since Next.js 13 App Router",
        status: "available",
        href: "/front-feature/nextjs/rsc-vs-csc",
      },
      {
        id: "client-prerender",
        title: "Client Component와 첫 HTML",
        description: "같은 카운터를 기본 사전 렌더링과 ssr: false로 표시합니다. 스크립트 차단·허용으로 서버 HTML과 버튼 동작을 구분합니다.",
        badge: "use client · ssr: false",
        since: "since Next.js 13",
        status: "available",
        href: "/front-feature/nextjs/client-prerender",
      },
      {
        id: "request-cache",
        title: "같은 서버 작업의 재사용",
        description: "같은 팀 데이터를 세 번 읽습니다. 일반 함수와 React cache의 실행 ID로 같은 인자 재사용과 새 요청의 경계를 확인합니다.",
        badge: "React cache",
        since: "since React 19 · Server Components",
        status: "available",
        href: "/front-feature/nextjs/request-cache",
      },
      {
        id: "server-actions",
        title: "API 요청과 서버 액션",
        description: "같은 이름을 실제 서버에 제출합니다. API 요청과 Server Action의 전송 경로, 서버 검증과 입력 복원을 비교합니다.",
        badge: "server actions",
        since: "since Next.js 14 · stable",
        status: "available",
        href: "/front-feature/nextjs/server-actions",
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
        description: "같은 대시보드를 일괄 SSR과 영역별 Suspense로 렌더링합니다. 실제 서버 응답에서 헤더·요약·활동 목록이 나타나는 순서를 비교합니다.",
        badge: "streaming",
        since: "since Next.js 13",
        status: "available",
        href: "/front-feature/nextjs/streaming",
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
