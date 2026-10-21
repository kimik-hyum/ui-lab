export type UpgradeStatus = "in-progress" | "completed" | "blocked" | "rolled-back";

export type PackageChange = {
  workspace: string;
  name: string;
  declaredBefore: string;
  declaredAfter: string;
  installedBefore: string;
  target: string;
  installedAfter: string | null;
};

export type UpgradeSource = {
  id: string;
  title: string;
  url: string;
  checkedOn: string;
};

export type CodeSnapshot = {
  startLine: number;
  code: string;
};

export type CodeExcerpt = {
  before: CodeSnapshot | null;
  after: CodeSnapshot | null;
};

export type FileCodeChange = {
  path: string;
  excerpts: CodeExcerpt[];
};

export type UsageChange = {
  paths: string[];
  reason: string;
  before: string;
  after: string;
  recommendation: string | null;
  sourceIds: string[];
  files: FileCodeChange[];
};

export type UpgradeLog = {
  schemaVersion: 2;
  id: string;
  title: string;
  summary: string;
  startedAt: string;
  updatedAt: string;
  status: UpgradeStatus;
  packages: PackageChange[];
  sources: UpgradeSource[];
  changes: UsageChange[];
};
