"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import LabIcon from "./LabIcon";
import { getCurrentPage, searchablePages } from "../lib/lab-navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPage = getCurrentPage(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLDialogElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const results = searchablePages.filter((page) =>
    `${page.label} ${page.description}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );

  const openSearch = () => {
    menuRef.current?.close();
    searchRef.current?.showModal();
    searchInputRef.current?.focus();
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (searchRef.current?.open) searchRef.current.close();
        else {
          menuRef.current?.close();
          searchRef.current?.showModal();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="app-shell" data-collapsed={collapsed}>
      <a href="#main-content" className="skip-link">
        본문으로 바로 가기
      </a>
      <aside className="shell-sidebar">
        <Sidebar onSearch={openSearch} />
      </aside>
      <header className="shell-topbar flex items-center justify-between gap-3 border-b border-border bg-white/95 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => menuRef.current?.showModal()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface xl:hidden"
            aria-label="메뉴 열기"
          >
            <LabIcon name="menu" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface xl:flex"
            aria-label={collapsed ? "사이드 메뉴 펼치기" : "사이드 메뉴 접기"}
            aria-expanded={!collapsed}
          >
            <LabIcon name="panel" className="h-[18px] w-[18px]" />
          </button>
          <nav
            aria-label="현재 위치"
            className="flex min-w-0 items-center gap-2.5 text-xs"
          >
            <Link
              href="/"
              className="hidden shrink-0 text-subtle-foreground transition-colors hover:text-foreground sm:block"
            >
              Workspace
            </Link>
            <LabIcon
              name="chevron-right"
              className="hidden h-3 w-3 shrink-0 text-slate-300 sm:block"
            />
            <span className="truncate font-medium text-foreground">
              {currentPage?.label ?? "UI Lab"}
            </span>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <span className="hidden items-center gap-1.5 text-[10px] font-medium tracking-wide text-subtle-foreground lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            FRONTEND EXPERIMENTS
          </span>
          <button
            onClick={openSearch}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-surface"
            aria-label="실험 검색"
          >
            <LabIcon name="search" className="h-4 w-4" />
          </button>
          <a
            href="https://github.com/kimik-hyum/ui-lab"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground sm:flex"
            aria-label="GitHub 저장소 (새 탭)"
          >
            <LabIcon name="github" className="h-4 w-4" />
            <span>GitHub</span>
            <LabIcon name="arrow-up-right" className="h-3 w-3" />
          </a>
        </div>
      </header>
      <div id="main-content" tabIndex={-1} className="shell-content">
        {children}
      </div>
      <dialog
        ref={menuRef}
        aria-label="탐색 메뉴"
        className="mobile-drawer"
        onClick={(event) => {
          if (event.target === event.currentTarget) menuRef.current?.close();
        }}
      >
        <div className="relative h-full bg-[#f5f7f8]">
          <button
            type="button"
            onClick={() => menuRef.current?.close()}
            className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-slate-200"
            aria-label="메뉴 닫기"
          >
            <LabIcon name="close" className="h-4 w-4" />
          </button>
          <Sidebar
            onSearch={openSearch}
            onNavigate={() => menuRef.current?.close()}
          />
        </div>
      </dialog>
      <dialog
        ref={searchRef}
        aria-labelledby="search-title"
        className="search-dialog"
        onClose={() => setQuery("")}
        onClick={(event) => {
          if (event.target === event.currentTarget) searchRef.current?.close();
        }}
      >
        <div className="overflow-hidden rounded-2xl bg-white">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <LabIcon name="search" className="h-5 w-5 shrink-0 text-accent" />
            <label
              id="search-title"
              htmlFor="experiment-search"
              className="sr-only"
            >
              실험과 페이지 검색
            </label>
            <input
              ref={searchInputRef}
              id="experiment-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="실험 이름, React, SSR…"
              className="min-w-0 flex-1 bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-subtle-foreground"
              autoComplete="off"
            />
            <button
              onClick={() => searchRef.current?.close()}
              aria-label="검색 닫기"
              className="rounded-md border border-border px-1.5 py-1 font-mono text-[10px] text-muted-foreground"
            >
              ESC
            </button>
          </div>
          <div className="max-h-[min(60dvh,460px)] overflow-y-auto p-2">
            <p
              className="px-3 pb-2 pt-3 text-[10px] font-semibold tracking-wider text-subtle-foreground"
              role="status"
            >
              {query ? `검색 결과 ${results.length}개` : "실험 및 페이지"}
            </p>
            {results.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                onClick={() => searchRef.current?.close()}
                className="group flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-accent-subtle focus-visible:bg-accent-subtle"
              >
                <LabIcon
                  name={page.icon}
                  className="h-[18px] w-[18px] shrink-0 text-muted-foreground group-hover:text-accent"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">
                    {page.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {page.description}
                  </span>
                </span>
                <LabIcon
                  name="arrow-right"
                  className="h-4 w-4 text-subtle-foreground"
                />
              </Link>
            ))}
            {results.length === 0 && (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                일치하는 실험이 없습니다. 다른 검색어를 입력해 주세요.
              </p>
            )}
          </div>
          <p className="border-t border-border bg-surface px-5 py-3 text-[10px] text-muted-foreground">
            Tab으로 이동 · Enter로 열기 · Esc로 닫기
          </p>
        </div>
      </dialog>
    </div>
  );
}
