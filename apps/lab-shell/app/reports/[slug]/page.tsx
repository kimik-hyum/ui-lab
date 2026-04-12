import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { parseReport } from "../utils/parseFrontmatter";
import { ReplayView } from "./ReplayView";
import { resolveDocsDir } from "../utils/docsDir";

export async function generateStaticParams() {
  const docsDir = await resolveDocsDir();
  if (!docsDir) return [];
  const files = await fs.readdir(docsDir);
  return files
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ slug: f.replace(/\.md$/, "") }));
}

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const docsDir = await resolveDocsDir();
  if (!docsDir) notFound();
  const filePath = path.join(docsDir, `${slug}.md`);

  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    notFound();
  }

  const report = parseReport(raw);
  return <ReplayView report={report} />;
}
