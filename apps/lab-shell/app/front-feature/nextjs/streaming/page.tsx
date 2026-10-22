import { readFile } from "node:fs/promises";
import path from "node:path";
import StreamingClientPage from "./StreamingClientPage";

export default async function StreamingComparisonPage() {
  const baseDir = path.join(process.cwd(), "app/front-feature/nextjs/streaming/components");
  const [blockingCode, streamingCode] = await Promise.all([
    readFile(path.join(baseDir, "BlockingDashboard.tsx"), "utf8"),
    readFile(path.join(baseDir, "StreamingDashboard.tsx"), "utf8"),
  ]);

  return <StreamingClientPage blockingCode={blockingCode} streamingCode={streamingCode} />;
}
