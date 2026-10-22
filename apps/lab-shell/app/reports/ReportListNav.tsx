"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReportFrontmatter } from "./utils/parseFrontmatter";

type ReportSummary = {
  slug: string;
  frontmatter: ReportFrontmatter;
};

export function ReportListNav({ reports }: { reports: ReportSummary[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="리포트 목록" className="space-y-1">
      {reports.length === 0 && <p className="px-3 py-4 text-xs leading-5 text-muted-foreground">아직 등록된 리포트가 없습니다.</p>}
      {reports.map(({ slug, frontmatter: fm }) => {
        const isActive = pathname === `/reports/${slug}`;
        return (
          <Link
            key={slug}
            href={`/reports/${slug}`}
            aria-current={isActive ? "page" : undefined}
            className={`block rounded-lg border px-3 py-3.5 transition-colors ${
              isActive
                ? "border-accent/15 bg-accent-subtle text-foreground"
                : "border-transparent text-muted-foreground hover:bg-surface hover:text-foreground"
            }`}
          >
            <p className="mb-2 text-xs font-medium leading-5">
              {fm.title}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[10px] text-muted-foreground">{fm.date}</span>
              {fm.verdicts.adopt > 0 && (
                <>
                  <span className="text-slate-300 text-[10px]">·</span>
                  <span className="text-[10px] font-medium text-accent">도입 {fm.verdicts.adopt}</span>
                </>
              )}
              {fm.verdicts.watch > 0 && (
                <>
                  <span className="text-slate-300 text-[10px]">·</span>
                  <span className="text-[10px] font-medium text-amber-700">관찰 {fm.verdicts.watch}</span>
                </>
              )}
              {fm.verdicts.skip > 0 && (
                <>
                  <span className="text-slate-300 text-[10px]">·</span>
                  <span className="text-[10px] text-muted-foreground">보류 {fm.verdicts.skip}</span>
                </>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
