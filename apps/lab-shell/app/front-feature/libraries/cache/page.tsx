import { promises as fs } from "node:fs";
import path from "node:path";
import queryPackage from "@tanstack/react-query/package.json";
import { CacheClientPage } from "./CacheClientPage";

export default async function CachePage() {
  const [manualCode, queryCode] = await Promise.all([
    fs.readFile(path.join(process.cwd(), "app/front-feature/libraries/cache/components/ManualFetchDemo.tsx"), "utf8"),
    fs.readFile(path.join(process.cwd(), "app/front-feature/libraries/cache/components/QueryCacheDemo.tsx"), "utf8"),
  ]);
  return <CacheClientPage manualCode={manualCode} queryCode={queryCode} libraryVersion={queryPackage.version} />;
}
