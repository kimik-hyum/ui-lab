import type { LabIconName } from "../components/icon-types";
import type { FeatureCatalogSection } from "../front-feature/components/FeatureCatalogTypes";
import { REACT_VERSION_SECTIONS } from "../front-feature/react/catalog";
import { NEXTJS_VERSION_SECTIONS } from "../front-feature/nextjs/catalog";
import { sections as LIBRARY_SECTIONS } from "../front-feature/libraries/catalog";
import { SSR_SECTIONS } from "../front-feature/ssr/catalog";
import { LAB_SECTIONS } from "../void-ui/catalog";

export type NavigationItem = { label: string; href: string; icon: LabIconName; exact?: boolean; matchPaths?: string[] };
type CatalogEntry = { title: string; description: string; href: string; category: "React" | "Next.js" | "실험실" | "라이브러리" | "SSR"; tag: string; icon: LabIconName };

export const featureNavigationItems: NavigationItem[] = [
  { label: "React", href: "/front-feature/react", icon: "react" },
  { label: "Next.js", href: "/front-feature/nextjs", icon: "next" },
  { label: "라이브러리 비교", href: "/front-feature/libraries", icon: "code" },
  { label: "SSR 구현 비교", href: "/front-feature/ssr", icon: "layers", matchPaths: ["/ssr-lab"] },
];

export const navigationGroups: { title: string; items: NavigationItem[] }[] = [
  { title: "워크스페이스", items: [
    { label: "프로젝트 개요", href: "/", icon: "grid", exact: true },
    { label: "실험실", href: "/void-ui", icon: "flask" },
    { label: "성능 측정", href: "/performance", icon: "gauge" },
  ] },
  { title: "기능 비교", items: featureNavigationItems },
  { title: "리소스", items: [
    { label: "버전업 로그", href: "/upgrade-logs", icon: "clock" },
    { label: "프로젝트 소개", href: "/about", icon: "info" },
  ] },
];
function catalogEntries(sections: FeatureCatalogSection[], category: CatalogEntry["category"], icon: LabIconName): CatalogEntry[] {
  return sections.flatMap((section) => section.features.flatMap((feature) => feature.status === "available" && feature.href ? [{ title: feature.title, description: feature.description, href: feature.href, tag: feature.badge, category, icon }] : []));
}
export const labExperiments = catalogEntries(LAB_SECTIONS, "실험실", "flask");
export const featureComparisons = [
  ...catalogEntries(REACT_VERSION_SECTIONS, "React", "react"),
  ...catalogEntries(NEXTJS_VERSION_SECTIONS, "Next.js", "next"),
  ...catalogEntries(LIBRARY_SECTIONS, "라이브러리", "code"),
  ...catalogEntries(SSR_SECTIONS, "SSR", "layers"),
];
export const searchablePages = [
  ...navigationGroups.flatMap((group) => group.items.map((item) => ({ ...item, description: group.title }))),
  { label: "버전별 측정 기록", href: "/performance/history", icon: "gauge" as const, description: "성능 측정 · 프레임워크 버전별 SSR·Lighthouse 기록" },
  ...labExperiments.map((item) => ({ label: item.title, href: item.href, icon: item.icon, description: `실험실 · ${item.tag}` })),
  ...featureComparisons.map((item) => ({ label: item.title, href: item.href, icon: item.icon, description: `기능 비교 · ${item.category} · ${item.tag}` })),
  { label: "무한스크롤 훅 해설", href: "/void-ui/pagination-infinite-scroll/hook", icon: "code" as const, description: "실험실 · 무한스크롤 구현 해설" },
  { label: "어댑터와 뷰 해설", href: "/void-ui/pagination-infinite-scroll/adapter-view", icon: "code" as const, description: "실험실 · 무한스크롤 구현 해설" },
  { label: "가상 목록 실행", href: "/void-ui/pagination-infinite-scroll/adapter-live", icon: "layers" as const, description: "실험실 · 무한스크롤 Virtuoso (가상화) 구현" },
];
export function getCurrentPage(pathname: string) {
  return [...searchablePages].sort((a,b) => b.href.length-a.href.length).find((page) => page.href === "/" ? pathname === "/" : pathname === page.href || pathname.startsWith(`${page.href}/`));
}

export function getPageSection(pathname: string) {
  if (pathname.startsWith("/performance/")) return { label: "성능 측정", href: "/performance" };
  if (pathname.startsWith("/void-ui/")) return { label: "실험실", href: "/void-ui" };
  if (pathname.startsWith("/front-feature/") || pathname.startsWith("/ssr-lab/")) {
    return { label: "기능 비교", href: null };
  }
  return null;
}
