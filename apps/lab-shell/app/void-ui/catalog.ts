import type { FeatureCatalogSection } from "../front-feature/components/FeatureCatalogTypes";

export const LAB_SECTIONS: FeatureCatalogSection[] = [
  {
    id: "navigation-lab",
    title: "목록 탐색",
    subtitle: "탐색성과 연속 스크롤 경험을 결합하는 실험",
    features: [
      {
        id: "pagination-infinite-scroll",
        title: "무한스크롤과 페이지 복원",
        description:
          "페이지 점프/복원과 인피니티 스크롤을 동시에 제공하는 하이브리드 탐색 UI를 실험합니다.",
        badge: "hybrid nav",
        since: "React · Virtuoso (가상화)",
        status: "available",
        href: "/void-ui/pagination-infinite-scroll",
      },
    ],
  },
];
