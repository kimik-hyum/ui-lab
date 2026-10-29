"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import LabIcon from "./LabIcon";
import { useSidebarHover } from "./useSidebarHover";
import { navigationGroups } from "../lib/lab-navigation";

export default function Sidebar({
  onNavigate,
  onSearch,
}: {
  onNavigate?: () => void;
  onSearch: () => void;
}) {
  const pathname = usePathname();
  const { style: hoverStyle, contentStyle, ...hoverEvents } = useSidebarHover();

  function renderGroups(presentation = false) {
    return navigationGroups.map((group) => (
      <div key={group.title}>
        <p className={`sidebar-label mb-2 px-3 text-[10px] font-semibold tracking-[0.06em] ${presentation ? "text-white" : "text-sidebar-muted"}`}>
          {group.title}
        </p>
        <div className="space-y-1">
          {group.items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`) ||
                item.matchPaths?.some((path) => pathname === path || pathname.startsWith(`${path}/`));
            const className = `sidebar-link relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium ${presentation ? "text-white" : active ? "z-20 bg-primary text-white" : "text-sidebar-foreground"}`;
            const content = <>
              <LabIcon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
              <span className="sidebar-label whitespace-nowrap">{item.label}</span>
              {active && <span className="sidebar-label ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" />}
            </>;

            return presentation ? (
              <div key={item.href} className={className}>{content}</div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={item.label}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                data-sidebar-item=""
                className={className}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    ));
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        className="sidebar-brand group flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-6"
        aria-label="UI Lab 프로젝트 개요"
        title="UI Lab"
      >
        <svg
          viewBox="0 0 40 40"
          width="40"
          height="40"
          className="h-10 w-10 shrink-0 text-primary transition-colors group-hover:text-blue-500"
          fill="none"
          aria-hidden="true"
        >
          <rect width="40" height="40" rx="11" fill="currentColor" />
          <path d="M8 10h4v13a4 4 0 0 0 8 0V10h4v13a8 8 0 0 1-16 0V10Z" fill="white" />
          <path d="M28 10h4v20h-4z" fill="white" />
        </svg>
        <span className="sidebar-label whitespace-nowrap text-[28px] leading-none font-semibold tracking-[-0.04em] text-blue-200">
          Lab
        </span>
      </Link>
      <div className="sidebar-inner flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4 pt-5">
        <Button
          variant="ghost"
          onClick={onSearch}
          title="통합 검색 (⌘K / Ctrl+K)"
          className="sidebar-search mb-7 flex min-h-10 w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-white/5 px-3 text-left text-[12px] text-sidebar-foreground hover:bg-white/5 hover:text-sidebar-foreground dark:hover:bg-white/5"
          aria-label="통합 검색"
        >
          <LabIcon name="search" className="h-4 w-4 shrink-0" />
          <span className="sidebar-label flex-1">통합 검색</span>
          <kbd className="sidebar-label rounded border border-sidebar-border px-1 font-mono text-[10px] text-sidebar-muted">
            ⌘ K
          </kbd>
        </Button>
        <nav
          {...hoverEvents}
          aria-label="주 메뉴"
          className="relative isolate flex flex-col gap-7"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
            <motion.div
              data-sidebar-hover=""
              className="absolute inset-x-0 top-0 overflow-hidden rounded-lg bg-white/10 ring-1 ring-inset ring-white/10"
              style={hoverStyle}
            >
              {/* Counter-movement keeps the white copy aligned with the clipped surface. */}
              <motion.div className="flex flex-col gap-7" style={contentStyle}>
                {renderGroups(true)}
              </motion.div>
            </motion.div>
          </div>
          {renderGroups()}
        </nav>
        <div className="mt-auto pt-10">
          <div className="sidebar-label rounded-xl border border-sidebar-border bg-white/5 p-3.5">
            <span className="flex items-center gap-2 text-[11px] font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              나만의 답을 만드는 실험실
            </span>
            <p className="mt-2 text-[11px] leading-relaxed text-sidebar-foreground">
              궁금한 것은 만들어보고,
              <br />
              선택에는 이유를 남깁니다.
            </p>
          </div>
          <a
            href="https://github.com/kimik-hyum/ui-lab"
            target="_blank"
            rel="noreferrer"
            title="GitHub 저장소 (새 탭)"
            className="sidebar-link mt-3 flex min-h-10 items-center gap-3 rounded-lg px-3 text-xs text-sidebar-foreground hover:bg-white/5 hover:text-white"
            aria-label="GitHub 저장소 (새 탭)"
          >
            <LabIcon name="github" className="h-[17px] w-[17px] shrink-0" />
            <span className="sidebar-label flex-1">소스 코드</span>
            <LabIcon
              name="arrow-up-right"
              className="sidebar-label h-3.5 w-3.5"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
