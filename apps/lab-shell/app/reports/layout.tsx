import { promises as fs } from "fs";
import path from "path";
import { parseReport } from "./utils/parseFrontmatter";
import { ReportListNav } from "./ReportListNav";
import { resolveDocsDir } from "./utils/docsDir";

async function getReports() {
  const docsDir = await resolveDocsDir();
  if (!docsDir) return [];
  const files = (await fs.readdir(docsDir)).filter((f) => f.endsWith(".md"));
  const reports = await Promise.all(
    files.map(async (file) => {
      const raw = await fs.readFile(path.join(docsDir, file), "utf8");
      const { frontmatter } = parseReport(raw);
      const slug = file.replace(/\.md$/, "");
      return { slug, frontmatter };
    }),
  );
  return reports.sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
}

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const reports = await getReports();

  const totalAdopt = reports.reduce((sum, r) => sum + r.frontmatter.verdicts.adopt, 0);
  const totalWatch = reports.reduce((sum, r) => sum + r.frontmatter.verdicts.watch, 0);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 리포트 목록 사이드바 */}
      <aside className="w-72 shrink-0 border-r border-slate-200 flex flex-col overflow-hidden bg-slate-50/60">
        {/* 헤더 */}
        <div className="px-4 pt-5 pb-4 border-b border-slate-200 shrink-0">
          <div className="mb-0.5">
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] text-violet-600 uppercase tracking-wider">
              AI Generated
            </span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight mt-2">Scout Reports</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Claude + Web Search 기술 검증</p>

          {/* 미니 스탯 */}
          <div className="mt-3 flex items-center gap-3 text-[11px]">
            <span className="text-slate-500 font-medium">{reports.length} 리포트</span>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-600 font-medium">✅ {totalAdopt}</span>
            <span className="text-slate-300">·</span>
            <span className="text-amber-500 font-medium">👀 {totalWatch}</span>
          </div>
        </div>

        {/* 리포트 목록 */}
        <ReportListNav reports={reports} />
      </aside>

      {/* 컨텐츠 영역 */}
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}
