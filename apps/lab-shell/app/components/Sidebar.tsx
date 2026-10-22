"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LabIcon from "./LabIcon";
import { navigationGroups } from "../lib/lab-navigation";

export default function Sidebar({
  onNavigate,
  onSearch,
}: {
  onNavigate?: () => void;
  onSearch: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        className="sidebar-brand flex h-16 shrink-0 items-center gap-3 border-b border-border px-6"
        aria-label="UI Lab 실험실 개요"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-foreground text-white">
          <LabIcon name="flask" className="h-[19px] w-[19px]" />
        </span>
        <span className="sidebar-label whitespace-nowrap text-[19px] font-extrabold tracking-[-0.8px] text-foreground">
          ui<span className="font-normal text-slate-400">/</span>lab
          <span className="ml-2 align-middle font-mono text-[9px] font-medium tracking-normal text-accent">
            LABS
          </span>
        </span>
      </Link>
      <div className="sidebar-inner flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4 pt-5">
        <button
          onClick={onSearch}
          title="실험 검색 (⌘K / Ctrl+K)"
          className="sidebar-search mb-7 flex min-h-10 w-full items-center gap-2.5 rounded-lg border border-border bg-white px-3 text-left text-[12px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          aria-label="실험 검색"
        >
          <LabIcon name="search" className="h-4 w-4 shrink-0" />
          <span className="sidebar-label flex-1">실험 검색</span>
          <kbd className="sidebar-label rounded border border-border px-1 font-mono text-[10px] text-subtle-foreground">
            ⌘ K
          </kbd>
        </button>
        <nav aria-label="주 메뉴" className="space-y-7">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <p className="sidebar-label mb-2 px-3 text-[10px] font-semibold tracking-[0.06em] text-subtle-foreground">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      title={item.label}
                      aria-current={active ? "page" : undefined}
                      aria-label={item.label}
                      className={`sidebar-link relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors ${active ? "bg-accent-subtle text-accent" : "text-muted-foreground hover:bg-slate-200/50 hover:text-foreground"}`}
                    >
                      <LabIcon
                        name={item.icon}
                        className="h-[18px] w-[18px] shrink-0"
                      />
                      <span className="sidebar-label whitespace-nowrap">
                        {item.label}
                      </span>
                      {active && (
                        <span className="sidebar-label ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-auto pt-10">
          <div className="sidebar-label rounded-xl border border-border bg-white/75 p-3.5">
            <span className="flex items-center gap-2 text-[11px] font-semibold text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              작게 만들고, 직접 검증하기
            </span>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              같은 문제, 다른 구현.
              <br />
              코드와 결과로 차이를 발견합니다.
            </p>
          </div>
          <a
            href="https://github.com/kimik-hyum/ui-lab"
            target="_blank"
            rel="noreferrer"
            title="GitHub 저장소 (새 탭)"
            className="sidebar-link mt-3 flex min-h-10 items-center gap-3 rounded-lg px-3 text-xs text-muted-foreground hover:bg-slate-200/50 hover:text-foreground"
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
