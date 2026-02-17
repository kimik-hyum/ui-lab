import { FeatureCatalog, FeatureCatalogSection } from "../components/FeatureCatalog";

const REACT_VERSION_SECTIONS: FeatureCatalogSection[] = [
  {
    id: "react-19",
    title: "React 19+",
    subtitle: "새로운 훅/폼 액션 기반 패턴",
    features: [
      {
        id: "optimistic",
        title: "Optimistic Updates",
        description: "useOptimistic 기반으로 pending 상태와 롤백 처리 복잡도를 비교합니다.",
        badge: "useOptimistic",
        since: "since React 19",
        status: "available",
        href: "/front-feature/react/optimistic",
      },
      {
        id: "actions",
        title: "Form Actions",
        description: "action + useFormStatus 기반 제출 흐름 비교를 추가할 예정입니다.",
        badge: "useFormStatus",
        since: "since React 19",
        status: "planned",
      },
      {
        id: "activity",
        title: "Activity Hidden Mode",
        description: "display: none 방식과 Activity hidden 모드의 백그라운드 업데이트 차이를 비교합니다.",
        badge: "<Activity>",
        since: "since React 19.2",
        status: "available",
        href: "/front-feature/react/activity",
      },
    ],
  },
  {
    id: "react-18",
    title: "React 18",
    subtitle: "동시성/렌더링 전략 중심",
    features: [
      {
        id: "transition",
        title: "Transition Patterns",
        description: "urgent vs non-urgent 업데이트 분리를 비교하는 시나리오를 준비 중입니다.",
        badge: "useTransition",
        since: "since React 18",
        status: "planned",
      },
      {
        id: "deferred-value",
        title: "Deferred Rendering",
        description: "입력 응답성과 무거운 렌더 분리를 다루는 예제를 추가할 예정입니다.",
        badge: "useDeferredValue",
        since: "since React 18",
        status: "planned",
      },
    ],
  },
];

export default function ReactFeaturesPage() {
  return (
    <FeatureCatalog
      title="React Feature Catalog"
      description="버전별로 기능을 정리하고, 현재 사용 가능한 비교 시나리오와 예정 항목을 분리해 관리합니다."
      sections={REACT_VERSION_SECTIONS}
    />
  );
}
