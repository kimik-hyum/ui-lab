import { readFile } from "node:fs/promises";
import path from "node:path";
import { DataLoadingClientPage } from "./DataLoadingClientPage";

export default async function DataLoadingComparisonPage() {
  const [sequential, parallel, data, result] = await Promise.all([
    readFile(path.join(process.cwd(), "app/ssr-lab/data-loading/server/SequentialData.tsx"), "utf8"),
    readFile(path.join(process.cwd(), "app/ssr-lab/data-loading/server/ParallelData.tsx"), "utf8"),
    readFile(path.join(process.cwd(), "app/ssr-lab/data-loading/server/data.ts"), "utf8"),
    readFile(path.join(process.cwd(), "app/ssr-lab/data-loading/components/DataLoadingResult.tsx"), "utf8"),
  ]);
  const sharedCode = `\n// 공통: server/data.ts\n${data}\n// 공통: components/DataLoadingResult.tsx\n${result}`;
  const leftCode = `// server/SequentialData.tsx\n${sequential}${sharedCode}`;
  const rightCode = `// server/ParallelData.tsx\n${parallel}${sharedCode}`;
  return <DataLoadingClientPage leftCode={leftCode} rightCode={rightCode} />;
}
