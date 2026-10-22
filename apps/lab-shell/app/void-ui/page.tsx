import { FeatureCatalog } from "../front-feature/components/FeatureCatalog";
import type { FeatureCatalogSection } from "../front-feature/components/FeatureCatalogTypes";

const VOID_UI_SECTIONS: FeatureCatalogSection[] = [
  {
    id: "navigation-lab",
    title: "탐색 패턴",
    subtitle: "탐색성과 연속 스크롤 경험을 결합하는 실험",
    features: [
      {
        id: "pagination-infinite-scroll",
        title: "Pagination + Infinite Scroll",
        description:
          "페이지 점프/복원과 인피니티 스크롤을 동시에 제공하는 하이브리드 탐색 UI를 실험합니다.",
        badge: "hybrid nav",
        since: "since Void UI v1",
        status: "available",
        href: "/void-ui/pagination-infinite-scroll",
      },
    ],
  },
];

export default function VoidUIPage() {
  return (
    <FeatureCatalog
      title="UI 실험"
      description="익숙한 패턴을 새롭게 조합합니다. 실제로 조작하며 탐색 흐름과 인터랙션을 검증하세요."
      sections={VOID_UI_SECTIONS}
    />
  );
}
