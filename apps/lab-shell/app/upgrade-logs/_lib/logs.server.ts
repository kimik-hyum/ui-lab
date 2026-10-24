import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { parseUpgradeLog } from "./parse-upgrade-log";

export const getUpgradeLogs = cache(async () => {
  // Yarn workspace와 standalone 서버 모두 apps/lab-shell을 작업 경로로 사용합니다.
  // 정적으로 한 디렉터리만 지정해야 Turbopack이 저장소 전체를 추적하지 않습니다.
  const directory = path.join(process.cwd(), "../../docs/upgrade-logs");
  let filenames: string[];
  try {
    filenames = await fs.readdir(directory);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
  const logs = await Promise.all(filenames.filter((file) => file.endsWith(".json")).map(async (filename) => {
    let raw: unknown;
    try { raw = JSON.parse(await fs.readFile(path.join(directory, filename), "utf8")); }
    catch (error) { throw new Error(`${filename}: 버전업 로그를 읽을 수 없습니다.`, { cause: error }); }
    return parseUpgradeLog(raw, filename);
  }));
  return logs.sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt) || b.id.localeCompare(a.id));
});
