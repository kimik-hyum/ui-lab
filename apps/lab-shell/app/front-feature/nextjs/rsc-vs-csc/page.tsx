import { promises as fs } from "fs";
import path from "path";
import { RscClientPage } from "./RscClientPage";

export default async function RscVsCscPage() {
  const baseDir = path.join(
    process.cwd(),
    "app/front-feature/nextjs/rsc-vs-csc",
  );

  const [cscCode, requestCode, rscCode] = await Promise.all([
    fs.readFile(path.join(baseDir, "components/CscArticleViewer.tsx"), "utf8"),
    fs.readFile(path.join(baseDir, "request-article.ts"), "utf8"),
    fs.readFile(path.join(baseDir, "components/RscArticleViewer.tsx"), "utf8"),
  ]);

  return (
    <RscClientPage
      cscCode={`// components/CscArticleViewer.tsx\n${cscCode}\n// request-article.ts\n${requestCode}`}
      rscCode={rscCode}
    />
  );
}
