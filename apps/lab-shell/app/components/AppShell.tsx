"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Sidebar from "./Sidebar";
import LabIcon from "./LabIcon";
import { getCurrentPage, getPageSection, searchablePages } from "../lib/lab-navigation";

function PreviewFrameBridge() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "ui-lab:infinite-location", pathname, search }, window.location.origin);
    }
  }, [pathname, search]);
  return null;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Embedded experiments keep their existing URL bridge and independent layout.
  if (pathname.startsWith("/preview-embed/")) {
    return <div className="min-h-screen min-w-0 bg-[#181816] text-[#e8e6df]">
      {pathname.startsWith("/preview-embed/infinite-scroll") && <Suspense fallback={null}><PreviewFrameBridge /></Suspense>}
      {children}
    </div>;
  }
  return <WorkspaceShell>{children}</WorkspaceShell>;
}

function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentPage = getCurrentPage(pathname);
  const section = getPageSection(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const results = searchablePages.filter((page) => `${page.label} ${page.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  function openSearch() { setMenuOpen(false); setSearchOpen(true); }
  function changeSearch(open: boolean) { setSearchOpen(open); if (!open) setQuery(""); }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMenuOpen(false);
        setQuery("");
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return <div className="app-shell" data-collapsed={collapsed}>
    <a href="#main-content" className="skip-link">본문으로 바로 가기</a>
    <aside className="shell-sidebar"><Sidebar onSearch={openSearch} /></aside>
    <header className="shell-topbar flex items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogTrigger render={<Button variant="ghost" size="icon-lg" className="xl:hidden" aria-label="메뉴 열기" />}><LabIcon name="menu" /></DialogTrigger>
          <DialogContent className="inset-y-0 left-0 h-dvh w-[min(304px,calc(100vw-40px))] max-w-none translate-x-0 translate-y-0 gap-0 rounded-none bg-sidebar p-0 text-sidebar-foreground sm:max-w-none [&>[data-slot=dialog-close]]:text-sidebar-foreground">
            <DialogTitle className="sr-only">탐색 메뉴</DialogTitle>
            <DialogDescription className="sr-only">실험실, 기능 비교, 성능 측정 페이지로 이동합니다.</DialogDescription>
            <Sidebar onSearch={openSearch} onNavigate={() => setMenuOpen(false)} />
          </DialogContent>
        </Dialog>
        <Button variant="ghost" size="icon" className="hidden xl:inline-flex" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "사이드 메뉴 펼치기" : "사이드 메뉴 접기"} aria-expanded={!collapsed}><LabIcon name="panel" /></Button>
        <nav aria-label="현재 위치" className="flex min-w-0 items-center gap-2.5 text-xs">
          <Link href="/" className="hidden shrink-0 text-muted-foreground hover:text-foreground sm:block">Workspace</Link>
          <LabIcon name="chevron-right" className="hidden h-3 w-3 shrink-0 text-subtle-foreground sm:block" />
          {section && <><Link href={section.href} className="hidden shrink-0 text-muted-foreground hover:text-foreground sm:block">{section.label}</Link><LabIcon name="chevron-right" className="hidden h-3 w-3 shrink-0 text-subtle-foreground sm:block" /></>}
          <span className="truncate font-medium">{currentPage?.label ?? "UI Lab"}</span>
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex"><span className="h-1.5 w-1.5 rounded-full bg-primary" />프론트엔드 연구 공간</span>
        <Button ref={searchButtonRef} variant="outline" size="icon-lg" onClick={openSearch} aria-label="통합 검색"><LabIcon name="search" /></Button>
        <a href="https://github.com/kimik-hyum/ui-lab" target="_blank" rel="noreferrer" className="hidden items-center gap-2 text-xs text-muted-foreground hover:text-foreground sm:flex" aria-label="GitHub 저장소 (새 탭)"><LabIcon name="github" />GitHub<LabIcon name="arrow-up-right" className="h-3 w-3" /></a>
      </div>
    </header>
    <div id="main-content" tabIndex={-1} className="shell-content">{children}</div>
    <Dialog open={searchOpen} onOpenChange={changeSearch}>
      <DialogContent initialFocus={searchInputRef} finalFocus={searchButtonRef} showCloseButton={false} className="top-[min(20vh,160px)] max-h-[75dvh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">실험실·기능 비교 통합 검색</DialogTitle>
        <DialogDescription className="sr-only">아이디어 이름이나 비교할 기술을 입력하세요.</DialogDescription>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <LabIcon name="search" className="h-5 w-5 shrink-0 text-primary" />
          <Input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} aria-label="검색어" placeholder="무한스크롤, React, SSR…" className="h-10 min-w-0 border-0 shadow-none focus-visible:ring-0" autoComplete="off" />
          <Button variant="outline" size="sm" onClick={() => changeSearch(false)} aria-label="검색 닫기">Esc</Button>
        </div>
        <div className="max-h-[55dvh] overflow-y-auto p-2">
          <p role="status" className="px-3 py-2 text-xs text-muted-foreground">{query ? `검색 결과 ${results.length}개` : "전체 페이지"}</p>
          {results.map((page) => <Link key={page.href} href={page.href} onClick={() => changeSearch(false)} className="group flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-primary-subtle focus-visible:bg-primary-subtle">
            <LabIcon name={page.icon} className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" />
            <span className="min-w-0 flex-1"><span className="block font-medium">{page.label}</span><span className="mt-1 block text-xs text-muted-foreground">{page.description}</span></span>
            <LabIcon name="arrow-right" className="h-4 w-4 text-subtle-foreground" />
          </Link>)}
          {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted-foreground">일치하는 페이지가 없습니다.</p>}
        </div>
        <p className="border-t border-border bg-surface px-5 py-3 text-xs text-muted-foreground">Tab으로 이동 · Enter로 열기 · Esc로 닫기</p>
      </DialogContent>
    </Dialog>
  </div>;
}
