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
        id: "form-actions",
        title: "Form Actions",
        description: "수동 제출과 useActionState + useFormStatus의 대기·오류·입력 초기화를 비교합니다.",
        badge: "useActionState",
        since: "since React 19",
        status: "available",
        href: "/front-feature/react/form-actions",
      },
      {
        id: "activity",
        title: "Activity Hidden Mode",
        description: "메모를 보존하면서 CSS 숨김과 Activity의 Effect 정리·interval 재시작을 비교합니다.",
        badge: "<Activity>",
        since: "since React 19.2",
        status: "available",
        href: "/front-feature/react/activity",
      },
      {
        id: "effect-event",
        title: "Effect Events",
        description: "테마 변경 시 재연결과 useEffectEvent의 최신 값 읽기를 실제 로컬 구독으로 비교합니다.",
        badge: "useEffectEvent",
        since: "since React 19.2",
        status: "available",
        href: "/front-feature/react/effect-event",
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
        description: "같은 느린 목록을 즉시 갱신하거나 useDeferredValue로 입력 뒤에 갱신하는 흐름을 비교합니다.",
        badge: "useDeferredValue",
        since: "since React 18",
        status: "available",
        href: "/front-feature/react/deferred-value",
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
