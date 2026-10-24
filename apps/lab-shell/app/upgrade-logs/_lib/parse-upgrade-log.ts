import type { CodeSnapshot, UpgradeLog } from "./types";

// Keep validation independent of Next.js so records can also be checked before a build.
export function parseUpgradeLog(value: unknown, filename: string): UpgradeLog {
  const fail = (field: string): never => {
    throw new Error(`${filename}: 올바르지 않은 버전업 로그 필드 (${field})`);
  };
  const object = (input: unknown, field: string): Record<string, unknown> => {
    if (!input || typeof input !== "object" || Array.isArray(input)) return fail(field);
    return input as Record<string, unknown>;
  };
  const text = (input: unknown, field: string): string => {
    if (typeof input !== "string" || !input.trim()) return fail(field);
    return input;
  };
  const list = (input: unknown, field: string): unknown[] => {
    if (!Array.isArray(input)) return fail(field);
    return input;
  };
  const texts = (input: unknown, field: string) =>
    list(input, field).map((item, index) => text(item, `${field}[${index}]`));
  const choice = <T extends string>(input: unknown, options: readonly T[], field: string): T => {
    const result = text(input, field);
    return options.includes(result as T) ? (result as T) : fail(field);
  };
  const timestamp = (input: unknown, field: string): string => {
    const result = text(input, field);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(result)
      || !Number.isFinite(Date.parse(result))) return fail(field);
    return result;
  };

  const record = object(value, "root");
  if (record.schemaVersion !== 1 && record.schemaVersion !== 2) fail("schemaVersion");
  if (record.schemaVersion === 2 && ("checks" in record || "limitations" in record)) fail("removed fields");
  const id = text(record.id, "id");
  if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)
    || filename !== `${id}.json`) fail("id/filename");
  const status = choice(record.status, ["in-progress", "completed", "blocked", "rolled-back"] as const, "status");
  const startedAt = timestamp(record.startedAt, "startedAt");
  const updatedAt = timestamp(record.updatedAt, "updatedAt");
  if (Date.parse(updatedAt) < Date.parse(startedAt)) fail("updatedAt");

  const packages = list(record.packages, "packages").map((item, index) => {
    const key = `packages[${index}]`;
    const pkg = object(item, key);
    return {
      workspace: text(pkg.workspace, `${key}.workspace`),
      name: text(pkg.name, `${key}.name`),
      declaredBefore: text(pkg.declaredBefore, `${key}.declaredBefore`),
      declaredAfter: text(pkg.declaredAfter, `${key}.declaredAfter`),
      installedBefore: text(pkg.installedBefore, `${key}.installedBefore`),
      target: text(pkg.target, `${key}.target`),
      installedAfter: pkg.installedAfter === null ? null : text(pkg.installedAfter, `${key}.installedAfter`),
    };
  });
  if (!packages.length) fail("packages");

  const sources = list(record.sources, "sources").map((item, index) => {
    const key = `sources[${index}]`;
    const source = object(item, key);
    const url = text(source.url, `${key}.url`);
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" || parsed.username || parsed.password) fail(`${key}.url`);
    } catch { fail(`${key}.url`); }
    const checkedOn = text(source.checkedOn, `${key}.checkedOn`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedOn)
      || !Number.isFinite(Date.parse(checkedOn))
      || new Date(checkedOn).toISOString().slice(0, 10) !== checkedOn) fail(`${key}.checkedOn`);
    return { id: text(source.id, `${key}.id`), title: text(source.title, `${key}.title`), url, checkedOn };
  });
  const sourceIds = new Set(sources.map((source) => source.id));
  if (sourceIds.size !== sources.length) fail("sources.id (duplicate)");

  const changes = list(record.changes, "changes").map((item, index) => {
    const key = `changes[${index}]`;
    const change = object(item, key);
    const paths = texts(change.paths, `${key}.paths`);
    if (!paths.length || paths.some((path) => path.startsWith("/") || path.includes("\\") || path.split("/").includes(".."))) fail(`${key}.paths`);
    const references = texts(change.sourceIds, `${key}.sourceIds`);
    if (references.some((ref) => !sourceIds.has(ref))) fail(`${key}.sourceIds`);
    const recommendation = change.recommendation === null || (record.schemaVersion === 1 && change.recommendation === undefined)
      ? null : text(change.recommendation, `${key}.recommendation`);
    if (recommendation && !references.length) fail(`${key}.recommendation/sourceIds`);
    const snapshot = (input: unknown, field: string): CodeSnapshot | null => {
      if (input === null) return null;
      const value = object(input, field);
      if (!Number.isSafeInteger(value.startLine) || (value.startLine as number) < 1) fail(`${field}.startLine`);
      if (typeof value.code !== "string" || !value.code.length) fail(`${field}.code`);
      return { startLine: value.startLine as number, code: value.code as string };
    };
    const files = list(change.files ?? [], `${key}.files`).map((item, fileIndex) => {
      const fileKey = `${key}.files[${fileIndex}]`;
      const file = object(item, fileKey);
      const path = text(file.path, `${fileKey}.path`);
      if (path.startsWith("/") || path.includes("\\") || path.split("/").includes("..")
        || !paths.some((entry) => path === entry || path.startsWith(`${entry}/`))) fail(`${fileKey}.path`);
      const excerpts = list(file.excerpts, `${fileKey}.excerpts`).map((item, excerptIndex) => {
        const excerptKey = `${fileKey}.excerpts[${excerptIndex}]`;
        const excerpt = object(item, excerptKey);
        const before = snapshot(excerpt.before, `${excerptKey}.before`);
        const after = snapshot(excerpt.after, `${excerptKey}.after`);
        if (!before && !after) fail(excerptKey);
        return { before, after };
      });
      if (!excerpts.length) fail(`${fileKey}.excerpts`);
      return { path, excerpts };
    });
    if (new Set(files.map((file) => file.path)).size !== files.length) fail(`${key}.files (duplicate)`);
    return { paths, reason: text(change.reason, `${key}.reason`), before: text(change.before, `${key}.before`), after: text(change.after, `${key}.after`), recommendation, sourceIds: references, files };
  });

  if (status === "completed" && (packages.some((pkg) => pkg.installedAfter === null)
    || !sources.length || !changes.length)) fail("completed evidence");

  // Older records remain readable, but execution reports are never passed to the UI.
  return {
    schemaVersion: 2, id, title: text(record.title, "title"), summary: text(record.summary, "summary"),
    startedAt, updatedAt, status, packages, sources, changes,
  };
}
