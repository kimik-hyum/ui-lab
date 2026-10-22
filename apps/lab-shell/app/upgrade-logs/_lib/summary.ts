import type { UpgradeLog, UpgradeStatus } from "./types";

export type UpgradeLogSummary = {
  id: string;
  title: string;
  summary: string;
  startedAt: string;
  status: UpgradeStatus;
  primary: { name: string; before: string; after: string };
  changeCount: number;
  fileCount: number;
  sourceCount: number;
};

export function summarizeUpgradeLog(log: UpgradeLog): UpgradeLogSummary {
  const primary = log.packages[0];
  return {
    id: log.id,
    title: log.title,
    summary: log.summary,
    startedAt: log.startedAt,
    status: log.status,
    primary: { name: primary.name, before: primary.installedBefore, after: primary.installedAfter ?? "확인 중" },
    changeCount: log.changes.length,
    fileCount: new Set(log.changes.flatMap((change) => change.files.map((file) => file.path))).size,
    sourceCount: log.sources.length,
  };
}
