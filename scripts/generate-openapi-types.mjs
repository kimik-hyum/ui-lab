import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputFile = join(rootDir, "packages/api-types/src/generated/database.openapi.ts");
const defaultSchema = "public";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key]) {
      continue;
    }

    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`,
        result.stdout,
        result.stderr,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return result;
}

async function fetchJson(url, headers) {
  const response = await fetch(url, { headers });
  const body = await response.text();

  if (!response.ok) {
    let errorPayload;

    try {
      errorPayload = JSON.parse(body);
    } catch {
      errorPayload = { message: body };
    }

    throw new Error(
      [
        `Supabase OpenAPI request failed: ${response.status}`,
        errorPayload.message,
        errorPayload.hint,
      ]
        .filter(Boolean)
        .join(" - "),
    );
  }

  return JSON.parse(body);
}

async function fetchOpenApiSpec() {
  const schema = process.env.SUPABASE_SCHEMA || defaultSchema;
  const managementToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF;

  if (managementToken && projectRef) {
    return fetchJson(
      `https://api.supabase.com/v1/projects/${projectRef}/database/openapi?schema=${schema}`,
      { Authorization: `Bearer ${managementToken}` },
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_OPENAPI_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      [
        "OpenAPI 타입 생성에는 인증 가능한 키가 필요합니다.",
        "방법 1: SUPABASE_URL + SUPABASE_SECRET_KEY 또는 SUPABASE_SERVICE_ROLE_KEY",
        "방법 2: SUPABASE_PROJECT_REF + SUPABASE_ACCESS_TOKEN",
        "현재 anon/publishable key만으로는 /rest/v1/ OpenAPI 스펙을 조회할 수 없습니다.",
      ].join("\n"),
    );
  }

  return fetchJson(`${supabaseUrl}/rest/v1/`, {
    "Accept-Profile": schema,
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
  });
}

function convertSwaggerIfNeeded(spec, tempDir) {
  if (spec.openapi) {
    const openApiFile = join(tempDir, "openapi.json");
    writeFileSync(openApiFile, JSON.stringify(spec, null, 2));
    return openApiFile;
  }

  if (!spec.swagger?.startsWith("2.")) {
    throw new Error("지원하지 않는 OpenAPI/Swagger 스펙 형식입니다.");
  }

  const swaggerFile = join(tempDir, "swagger.json");
  const openApiFile = join(tempDir, "openapi.json");
  writeFileSync(swaggerFile, JSON.stringify(spec, null, 2));
  run("yarn", ["swagger2openapi", swaggerFile, "-o", openApiFile]);
  return openApiFile;
}

async function main() {
  loadEnvFile(join(rootDir, ".env.local"));
  loadEnvFile(join(rootDir, "apps/next-lab/.env.local"));

  const tempDir = mkdtempSync(join(tmpdir(), "ui-lab-openapi-"));

  try {
    const spec = await fetchOpenApiSpec();
    const openApiFile = convertSwaggerIfNeeded(spec, tempDir);
    run("yarn", ["openapi-typescript", openApiFile, "-o", outputFile], {
      stdio: "inherit",
    });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
