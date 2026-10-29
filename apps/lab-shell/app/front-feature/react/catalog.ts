import type { FeatureCatalogSection } from "../components/FeatureCatalogTypes";

export const REACT_VERSION_SECTIONS: FeatureCatalogSection[] = [
  {
    id: "react-19",
    title: "React 19+",
    subtitle: "기본 훅으로 직접 관리하던 상태·Effect와 React 19 기능 적용을 비교합니다.",
    features: [
      {
        id: "optimistic",
        title: "Optimistic Updates",
        description: "useState로 낙관 상태와 실패 복구를 직접 관리하는 구현과 useOptimistic을 비교합니다.",
        badge: "useOptimistic",
        since: "since React 19",
        status: "available",
        href: "/front-feature/react/optimistic",
      },
      {
        id: "form-actions",
        title: "Form Actions",
        description: "useState와 onSubmit으로 제출 상태를 직접 관리하는 구현과 useActionState·useFormStatus를 비교합니다.",
        badge: "useActionState",
        since: "since React 19",
        status: "available",
        href: "/front-feature/react/form-actions",
      },
      {
        id: "activity",
        title: "Activity Hidden Mode",
        description: "useState로 CSS 숨김을 전환하는 기본 구현과 숨길 때 Effect도 정리하는 Activity를 비교합니다.",
        badge: "<Activity>",
        since: "since React 19.2",
        status: "available",
        href: "/front-feature/react/activity",
      },
      {
        id: "effect-event",
        title: "Effect Events",
        description: "useEffect 의존성으로 최신 테마를 반영하는 기본 구현과 useEffectEvent로 읽기 로직을 분리한 구현을 비교합니다.",
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
    subtitle: "useState의 기본 갱신과 React 18의 업데이트 우선순위 기능을 비교합니다.",
    features: [
      {
        id: "transition",
        title: "Transition Patterns",
        description: "useState로 함께 갱신하는 기본 구현과 useTransition으로 업데이트 우선순위를 나누는 비교를 준비 중입니다.",
        badge: "useTransition",
        since: "since React 18",
        status: "planned",
      },
      {
        id: "deferred-value",
        title: "Deferred Rendering",
        description: "useState의 입력값을 목록에 바로 반영하는 기본 구현과 useDeferredValue로 목록 갱신을 늦추는 구현을 비교합니다.",
        badge: "useDeferredValue",
        since: "since React 18",
        status: "available",
        href: "/front-feature/react/deferred-value",
      },
    ],
  },
];
