import { FeatureCatalog, FeatureCatalogSection } from "../front-feature/components/FeatureCatalog";

const VOID_UI_SECTIONS: FeatureCatalogSection[] = [
  {
    id: "navigation-lab",
    title: "Navigation Lab",
    subtitle: "탐색성과 연속 스크롤 경험을 결합하는 실험",
    features: [
      {
        id: "pagination-infinite-scroll",
        title: "Pagenation Infinify Scroll",
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
      title="Void UI Catalog"
      description="기존 패턴을 조합해 새로운 탐색 경험을 검증하는 실험 목록입니다."
      sections={VOID_UI_SECTIONS}
    />
  );
}
