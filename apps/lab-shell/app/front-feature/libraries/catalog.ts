import type { FeatureCatalogSection } from "../components/FeatureCatalogTypes";

export const sections: FeatureCatalogSection[] = [{
  id: "lists", title: "목록 렌더링", subtitle: "같은 데이터와 화면에서 라이브러리의 역할을 확인합니다.",
  features: [{
    id: "virtual-list", title: "전체 목록과 가상 목록",
    description: "React map과 실제 Virtuoso의 DOM 행 수와 인덱스 이동을 비교합니다.",
    badge: "react-virtuoso", since: "react-virtuoso 4", status: "available",
    href: "/front-feature/libraries/virtual-list",
  }],
}, {
  id: "data", title: "데이터 요청과 캐시", subtitle: "같은 API를 다시 읽을 때의 대기와 재사용을 비교합니다.",
  features: [{
    id: "cache", title: "캐시와 재요청",
    description: "캐시 없는 수동 조회와 TanStack Query의 결과 재사용을 실제 요청으로 확인합니다.",
    badge: "TanStack Query", since: "TanStack Query 5", status: "available",
    href: "/front-feature/libraries/cache",
  }],
}];
