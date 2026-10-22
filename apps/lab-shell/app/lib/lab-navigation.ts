import type { LabIconName } from "../components/icon-types";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LabIconName;
  exact?: boolean;
};
export type Experiment = {
  title: string;
  description: string;
  href: string;
  category: "React" | "Next.js" | "UI";
  tag: string;
  icon: LabIconName;
};

export const navigationGroups: { title: string; items: NavigationItem[] }[] = [
  {
    title: "워크스페이스",
    items: [
      { label: "실험실 개요", href: "/", icon: "grid", exact: true },
      { label: "SSR · 성능 분석", href: "/performance", icon: "gauge" },
    ],
  },
  {
    title: "실험 탐색",
    items: [
      { label: "React 기능", href: "/front-feature/react", icon: "react" },
      { label: "Next.js 기능", href: "/front-feature/nextjs", icon: "next" },
      { label: "UI 패턴", href: "/void-ui", icon: "layers" },
    ],
  },
  {
    title: "리소스",
    items: [
      { label: "검증 리포트", href: "/reports", icon: "book" },
      { label: "프로젝트 소개", href: "/about", icon: "info" },
    ],
  },
];

export const experiments: Experiment[] = [
  {
    title: "Optimistic Updates",
    description:
      "직접 구현한 롤백과 useOptimistic의 상태 관리 흐름을 비교합니다.",
    href: "/front-feature/react/optimistic",
    category: "React",
    tag: "useOptimistic",
    icon: "react",
  },
  {
    title: "Activity Hidden Mode",
    description:
      "display: none과 Activity의 숨김 처리, 렌더와 이펙트 비용을 살펴봅니다.",
    href: "/front-feature/react/activity",
    category: "React",
    tag: "React 19.2",
    icon: "react",
  },
  {
    title: "Server vs Client Components",
    description:
      "같은 아티클 뷰어에서 데이터 요청과 첫 화면의 차이를 확인합니다.",
    href: "/front-feature/nextjs/rsc-vs-csc",
    category: "Next.js",
    tag: "App Router",
    icon: "next",
  },
  {
    title: "Pagination + Infinite Scroll",
    description: "페이지 이동과 무한 스크롤을 결합한 탐색 경험을 실험합니다.",
    href: "/void-ui/pagination-infinite-scroll",
    category: "UI",
    tag: "Hybrid navigation",
    icon: "layers",
  },
];

export const searchablePages = [
  ...navigationGroups.flatMap((group) =>
    group.items.map((item) => ({ ...item, description: group.title })),
  ),
  ...experiments.map((item) => ({
    label: item.title,
    href: item.href,
    icon: item.icon,
    description: `${item.category} · ${item.tag}`,
  })),
  {
    label: "기능 비교 전체 보기",
    href: "/front-feature",
    icon: "code" as const,
    description: "React · Next.js",
  },
  {
    label: "Hybrid Infinite Hook",
    href: "/void-ui/pagination-infinite-scroll/hook",
    icon: "code" as const,
    description: "UI 패턴 · 훅 코드 해설",
  },
  {
    label: "Adapter & View",
    href: "/void-ui/pagination-infinite-scroll/adapter-view",
    icon: "code" as const,
    description: "UI 패턴 · 어댑터와 뷰 코드 해설",
  },
  {
    label: "Adapter Live Demo",
    href: "/void-ui/pagination-infinite-scroll/adapter-live",
    icon: "layers" as const,
    description: "UI 패턴 · 라이브 데모",
  },
];

export function getCurrentPage(pathname: string) {
  return [...searchablePages]
    .sort((a, b) => b.href.length - a.href.length)
    .find((page) =>
      page.href === "/"
        ? pathname === "/"
        : pathname === page.href || pathname.startsWith(`${page.href}/`),
    );
}
