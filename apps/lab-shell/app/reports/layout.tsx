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
    <div className="grid min-h-[calc(100dvh-var(--shell-header-height))] min-w-0 lg:grid-cols-[248px_minmax(0,1fr)] 2xl:grid-cols-[272px_minmax(0,1fr)]">
      <aside aria-label="분석 리포트 탐색" className="min-w-0 border-b border-border bg-white lg:sticky lg:top-[var(--shell-header-height)] lg:flex lg:h-[calc(100dvh-var(--shell-header-height))] lg:flex-col lg:border-r lg:border-b-0">
        <div className="shrink-0 px-5 pt-6 pb-5">
          <p className="font-mono text-[10px] tracking-[0.15em] text-accent">RESEARCH NOTES</p>
          <h2 className="mt-2 text-base font-semibold tracking-tight text-foreground">Scout Reports</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">새로운 기능과 실무 도입 가능성</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-medium">
            <span className="rounded-md border border-border bg-surface px-2 py-1 text-muted-foreground">{reports.length} 리포트</span>
            <span className="rounded-md bg-accent-subtle px-2 py-1 text-accent">도입 {totalAdopt}</span>
            <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">관찰 {totalWatch}</span>
          </div>
        </div>
        <div className="hidden min-h-0 flex-1 overflow-y-auto border-t border-border px-2 py-3 lg:block">
          <ReportListNav reports={reports} />
        </div>
        <details className="group border-t border-border lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-xs font-medium text-foreground [&::-webkit-details-marker]:hidden">
            리포트 목록 <span className="font-mono text-base text-muted-foreground transition-transform group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <div className="px-2 pb-3"><ReportListNav reports={reports} /></div>
        </details>
        <p className="hidden border-t border-border px-5 py-4 text-[11px] leading-5 text-muted-foreground lg:block">AI 분석 결과와 구현 예제를 함께 검토하는 연구 기록입니다.</p>
      </aside>
      <main className="min-w-0 bg-background">{children}</main>
    </div>
  );
}
