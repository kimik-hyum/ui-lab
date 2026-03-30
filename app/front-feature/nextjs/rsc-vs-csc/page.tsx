import { promises as fs } from "fs";
import path from "path";
import { DEMO_ARTICLE } from "./article";
import { RscClientPage } from "./RscClientPage";

export default async function RscVsCscPage() {
  const baseDir = path.join(
    process.cwd(),
    "app/front-feature/nextjs/rsc-vs-csc/components",
  );

  const [cscCode, rscCode] = await Promise.all([
    fs.readFile(path.join(baseDir, "CscArticleViewer.tsx"), "utf8"),
    fs.readFile(path.join(baseDir, "RscArticleViewer.tsx"), "utf8"),
  ]);

  return (
    <RscClientPage
      cscCode={cscCode}
      rscCode={rscCode}
      prefetchedArticle={DEMO_ARTICLE}
    />
  );
}
