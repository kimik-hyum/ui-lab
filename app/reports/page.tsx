import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import { parseReport } from "./utils/parseFrontmatter";

async function getReports() {
  const docsDir = path.join(process.cwd(), "docs");
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

export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <main className="min-h-screen bg-black p-8 text-white md:p-14">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 border-b border-zinc-800 pb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-500 uppercase tracking-wider">
              AI Generated
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Scout Reports</h1>
          <p className="mt-3 text-zinc-400">
            로컬에서 Claude API + Web Search로 생성한 프론트엔드 기술 검증 리포트 아카이브입니다.
          </p>

          <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-500 leading-relaxed">
            <span className="text-zinc-300 font-medium">어떻게 만들어졌나요?</span>
            {" "}로컬 개발 환경에서 기술을 선택하면 Claude가 Web Search를 활용해 최신 동향·호환성·성능 데이터를 수집하고,
            이를 바탕으로 도입 여부를 판정합니다. 이 페이지는 그 결과를 보관하는 아카이브입니다.
            실제 분석 워크플로우는 로컬에서만 동작합니다.
          </div>
        </header>

        <div className="space-y-4">
          {reports.map(({ slug, frontmatter: fm }) => (
            <Link
              key={slug}
              href={`/reports/${slug}`}
              className="group block rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition-all hover:border-zinc-600 hover:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] text-zinc-500">{fm.date}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-[10px] text-zinc-500">{fm.model}</span>
                  </div>
                  <h2 className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors truncate">
                    {fm.title}
                  </h2>

                  {/* 선택된 기술 칩 */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {fm.selected.map((chip) => (
                      <span
                        key={chip.id}
                        className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300"
                      >
                        {chip.label} {chip.version}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 판정 요약 */}
                <div className="shrink-0 flex flex-col items-end gap-1 text-[11px]">
                  {fm.verdicts.adopt > 0 && (
                    <span className="text-emerald-400">✅ {fm.verdicts.adopt}</span>
                  )}
                  {fm.verdicts.watch > 0 && (
                    <span className="text-amber-400">👀 {fm.verdicts.watch}</span>
                  )}
                  {fm.verdicts.skip > 0 && (
                    <span className="text-zinc-500">⏭ {fm.verdicts.skip}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
