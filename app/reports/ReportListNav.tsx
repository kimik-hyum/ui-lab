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
    <nav className="flex-1 overflow-y-auto py-1">
      {reports.map(({ slug, frontmatter: fm }) => {
        const isActive = pathname === `/reports/${slug}`;
        return (
          <Link
            key={slug}
            href={`/reports/${slug}`}
            className={`block px-4 py-3 border-l-2 transition-colors ${
              isActive
                ? "border-l-violet-500 bg-violet-50 text-slate-900"
                : "border-l-transparent hover:bg-white text-slate-600 hover:text-slate-900"
            }`}
          >
            <p className="text-xs font-medium leading-snug line-clamp-2 mb-1.5">
              {fm.title}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400">{fm.date}</span>
              {fm.verdicts.adopt > 0 && (
                <>
                  <span className="text-slate-300 text-[10px]">·</span>
                  <span className="text-[10px] text-emerald-600 font-medium">✅ {fm.verdicts.adopt}</span>
                </>
              )}
              {fm.verdicts.watch > 0 && (
                <>
                  <span className="text-slate-300 text-[10px]">·</span>
                  <span className="text-[10px] text-amber-500 font-medium">👀 {fm.verdicts.watch}</span>
                </>
              )}
              {fm.verdicts.skip > 0 && (
                <>
                  <span className="text-slate-300 text-[10px]">·</span>
                  <span className="text-[10px] text-slate-400">⏭ {fm.verdicts.skip}</span>
                </>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
