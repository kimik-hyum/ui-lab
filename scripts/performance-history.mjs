import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const VERSION_PACKAGES = ["next", "react", "react-router", "@sveltejs/kit", "svelte", "nuxt", "vue", "vite", "@supabase/supabase-js"];

export function captureTargetVersions(root, workspace) {
  const manifestPath = resolve(root, "apps", workspace, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const require = createRequire(manifestPath);
  const versions = {};
  for (const name of VERSION_PACKAGES) {
    if (!manifest.dependencies?.[name] && !manifest.devDependencies?.[name]) continue;
    // Resolve the installed package from this workspace, never a semver range.
    versions[name] = JSON.parse(readFileSync(require.resolve(`${name}/package.json`), "utf8")).version;
  }
  return { versions, versionEvidence: { kind: "installed", reference: "측정 시 설치 패키지" } };
}

export function captureSource(root) {
  try {
    return {
      commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(),
      dirty: Boolean(execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim()),
    };
  } catch {
    return null;
  }
}

export function toHistoryRecord(kind, summary) {
  if (!["ssr", "lighthouse"].includes(kind) || !Number.isFinite(Date.parse(summary.generatedAt))) {
    throw new Error("Invalid measurement kind or timestamp");
  }
  const combined = Boolean(summary.ssr && summary.lighthouse);
  const settings = combined ? summary[kind] : summary;
  const mode = combined ? summary.mode : "isolated";
  return {
    id: `${kind}-${summary.generatedAt.replace(/[:.]/g, "-")}`,
    kind,
    generatedAt: summary.generatedAt,
    mode,
    path: settings.path,
    runs: settings.runs,
    warmup: settings.warmup ?? null,
    preset: settings.preset ?? null,
    expectedText: settings.expectedText ?? null,
    environment: summary.environment,
    source: summary.source ?? null,
    targets: summary.targets.map((target) => {
      const result = combined ? target[kind] : target;
      return {
        name: target.name,
        versions: target.versions ?? {},
        versionEvidence: target.versionEvidence ?? null,
        medianMetrics: result.medianMetrics,
        distribution: result.distribution ?? null,
        checklist: result.checklist ?? null,
        medianPerformanceScore: result.medianPerformanceScore ?? null,
        medianRun: result.medianRun ?? null,
      };
    }),
  };
}

export function savePerformanceHistory(root, kind, summary) {
  const record = toHistoryRecord(kind, summary);
  const file = resolve(root, "perf-results", "history.json");
  const history = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { schemaVersion: 1, records: [] };
  if (history.schemaVersion !== 1 || !Array.isArray(history.records)) throw new Error("Unsupported performance history");
  const existing = history.records.find((item) => item.id === record.id);
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(record)) throw new Error(`Measurement already exists with different data: ${record.id}`);
    return record;
  }
  history.records.push(record);
  history.records.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt) || a.id.localeCompare(b.id));
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(history, null, 2)}\n`);
  renameSync(temporary, file);
  return record;
}
