import type { FeatureCatalogSection } from "../front-feature/components/FeatureCatalogTypes";

export const LAB_SECTIONS: FeatureCatalogSection[] = [
  {
    id: "standalone-services",
    title: "별도 서비스",
    subtitle: "독립된 사이트에서 제공하는 서비스와 도구",
    features: [
      {
        id: "maps-editor",
        title: "Termia · 지도 편집기",
        description: "지도 위에 도형을 그리고, 영역을 합치거나 반경을 만들 수 있는 웹 편집기입니다.",
        badge: "map editor",
        since: "React · OpenLayers",
        status: "available",
        href: "/void-ui/maps-editor",
        image: { src: "/images/termia-map.svg", alt: "", width: 1200, height: 800 },
        actionLabel: "소개 보기",
      },
    ],
  },
  {
    id: "ui-implementations",
    title: "UI 구현",
    subtitle: "다양한 인터랙션과 화면 구성을 직접 구현하는 실험",
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
