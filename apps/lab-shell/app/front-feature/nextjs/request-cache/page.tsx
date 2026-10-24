import { readFile } from "node:fs/promises";
import path from "node:path";
import { RequestCacheClientPage } from "./RequestCacheClientPage";

export default async function RequestCachePage() {
  const [direct, cached, shared, wrapper, config] = await Promise.all([
    readFile(path.join(process.cwd(), "app/front-feature/nextjs/request-cache/components/DirectTeamReads.tsx"), "utf8"),
    readFile(path.join(process.cwd(), "app/front-feature/nextjs/request-cache/components/CachedTeamReads.tsx"), "utf8"),
    readFile(path.join(process.cwd(), "app/front-feature/nextjs/request-cache/read-team.server.ts"), "utf8"),
    readFile(path.join(process.cwd(), "app/front-feature/nextjs/request-cache/cached-team.server.ts"), "utf8"),
    readFile(path.join(process.cwd(), "app/front-feature/nextjs/request-cache/config.ts"), "utf8"),
  ]);
  const common = `\n// 공통: config.ts\n${config}\n// 공통: read-team.server.ts\n${shared}`;
  return <RequestCacheClientPage directCode={`// DirectTeamReads.tsx\n${direct}${common}`} cachedCode={`// CachedTeamReads.tsx\n${cached}\n// cached-team.server.ts\n${wrapper}${common}`} />;
}
