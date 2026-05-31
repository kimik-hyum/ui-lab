#!/usr/bin/env node

import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import os from "node:os";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const ROOT_DIR = process.cwd();
const MIN_RUNS = toInt(process.env.LH_MIN_RUNS, 5);
const RUNS = Math.max(toInt(process.env.LH_RUNS, 5), MIN_RUNS);
const TARGET_PATH = normalizePath(process.env.LH_PATH ?? "/");
const PRESET = process.env.LH_PRESET ?? "desktop";
const CHROME_FLAGS = process.env.LH_CHROME_FLAGS ?? "--headless=new --no-sandbox";
const TARGET_FILTER = parseTargetFilter(process.env.LH_TARGETS);

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_DIR = resolve(ROOT_DIR, "perf-results", "lighthouse", TIMESTAMP);
const LATEST_PATH = resolve(ROOT_DIR, "perf-results", "lighthouse", "latest.json");
const TARGETS_PATH = resolve(ROOT_DIR, "perf-results", "lighthouse", "targets.json");

const fallbackTargets = [
  {
    name: "next-lab",
    baseUrl: "http://127.0.0.1:3001",
    build: ["yarn", "workspace", "next-lab", "build"],
    start: ["yarn", "workspace", "next-lab", "start"],
  },
  {
    name: "sveltekit-lab",
    baseUrl: "http://127.0.0.1:3002",
    build: ["yarn", "workspace", "sveltekit-lab", "build"],
    start: ["yarn", "workspace", "sveltekit-lab", "preview"],
  },
  {
    name: "vue-lab",
    baseUrl: "http://127.0.0.1:3004",
    build: ["yarn", "workspace", "vue-lab", "build"],
    start: ["yarn", "workspace", "vue-lab", "preview"],
  },
  {
    name: "react-router-lab",
    baseUrl: "http://127.0.0.1:3005",
    build: ["yarn", "workspace", "react-router-lab", "build"],
    start: ["yarn", "workspace", "react-router-lab", "preview"],
  },
];

async function main() {
  const selectedTargets = readTargets().filter((target) => {
    return TARGET_FILTER.size === 0 || TARGET_FILTER.has(target.name);
  });

  if (selectedTargets.length === 0) {
    throw new Error(`No Lighthouse targets matched: ${[...TARGET_FILTER].join(", ")}`);
  }

  for (const target of selectedTargets) {
    await assertBaseUrlAvailable(target, "LH_TARGETS");
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const summary = {
    generatedAt: new Date().toISOString(),
    path: TARGET_PATH,
    runs: RUNS,
    minRuns: MIN_RUNS,
    preset: PRESET,
    chromeFlags: CHROME_FLAGS,
    environment: buildEnvironmentSummary(),
    targets: [],
  };

  for (const target of selectedTargets) {
    const url = `${target.baseUrl}${TARGET_PATH}`;
    console.log(`\n[${target.name}] build`);
    await runCommand(target.build, { env: buildTargetEnv(target) });

    console.log(`[${target.name}] start server`);
    const server = spawnCommand(target.start, {
      cwd: ROOT_DIR,
      stdio: "inherit",
      env: buildTargetEnv(target),
    });

    try {
      await waitForHttp(url);
      console.log(`[${target.name}] lighthouse x${RUNS} -> ${url}`);

      const runResults = [];
      for (let i = 1; i <= RUNS; i += 1) {
        const reportPath = resolve(OUTPUT_DIR, `${target.name}.run-${i}.json`);
        await runCommand([
          "yarn",
          "lighthouse",
          url,
          "--quiet",
          "--output=json",
          "--output-path",
          reportPath,
          "--only-categories=performance",
          `--preset=${PRESET}`,
          `--chrome-flags=${CHROME_FLAGS}`,
        ]);
        runResults.push(readReport(reportPath, i));
      }

      const median = pickMedianRun(runResults);
      summary.targets.push({
        name: target.name,
        url,
        medianRun: median.run,
        medianPerformanceScore: median.performanceScore,
        medianMetrics: median.metrics,
        runs: runResults,
      });
    } finally {
      await stopProcess(server);
    }
  }

  writeFileSync(resolve(OUTPUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));
  writeFileSync(LATEST_PATH, JSON.stringify(summary, null, 2));

  console.log(`\nSaved summary: ${resolve(OUTPUT_DIR, "summary.json")}`);
  console.log(`Updated latest: ${LATEST_PATH}`);
}

function readTargets() {
  if (!existsSync(TARGETS_PATH)) return fallbackTargets;

  const payload = JSON.parse(readFileSync(TARGETS_PATH, "utf8"));
  const configuredTargets = Array.isArray(payload.targets) ? payload.targets : [];

  if (configuredTargets.length === 0) return fallbackTargets;
  return configuredTargets;
}

function readReport(reportPath, run) {
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const performanceScore = round2((report.categories?.performance?.score ?? 0) * 100);
  const metrics = {
    fcpMs: metric(report, "first-contentful-paint"),
    lcpMs: metric(report, "largest-contentful-paint"),
    tbtMs: metric(report, "total-blocking-time"),
    cls: metric(report, "cumulative-layout-shift"),
    speedIndexMs: metric(report, "speed-index"),
    inpMs: metric(report, "interaction-to-next-paint"),
  };

  return {
    run,
    performanceScore,
    metrics,
  };
}

function metric(report, id) {
  const value = report.audits?.[id]?.numericValue;
  if (typeof value !== "number") return null;
  return round2(value);
}

function pickMedianRun(results) {
  const sorted = [...results].sort((a, b) => a.performanceScore - b.performanceScore);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

async function waitForHttp(url, timeoutMs = 90_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status >= 200 && response.status < 500) return;
    } catch {
      // ignore until timeout
    }
    await delay(1_000);
  }

  throw new Error(`Timed out waiting for server: ${url}`);
}

async function assertBaseUrlAvailable(target, filterEnvName) {
  const url = new URL(target.baseUrl);
  const host = url.hostname;
  const port = Number(url.port);

  if (!port) {
    throw new Error(`Target ${target.name} must include an explicit port: ${target.baseUrl}`);
  }

  const isAvailable = await canListen(host, port);
  if (!isAvailable) {
    throw new Error(
      `Port ${port} is already in use for ${target.name}. Stop the existing server or filter targets with ${filterEnvName} before running Lighthouse.`,
    );
  }
}

async function canListen(host, port) {
  return new Promise((resolvePromise) => {
    const server = createServer();

    server.once("error", () => {
      resolvePromise(false);
    });

    server.once("listening", () => {
      server.close(() => resolvePromise(true));
    });

    server.listen(port, host);
  });
}

async function runCommand(command, options = {}) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawnCommand(command, { cwd: ROOT_DIR, stdio: "inherit", ...options });
    child.on("error", rejectPromise);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`${command.join(" ")} failed with code ${code}`));
    });
  });
}

function spawnCommand(command, options = {}) {
  const [binary, ...args] = command;
  return spawn(binary, args, options);
}

async function stopProcess(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");

  const timeout = delay(5_000).then(() => "timeout");
  const exited = once(child, "exit").then(() => "exit");
  const result = await Promise.race([timeout, exited]);

  if (result === "timeout" && child.exitCode === null) {
    child.kill("SIGKILL");
    await once(child, "exit");
  }
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function parseTargetFilter(value) {
  if (!value) return new Set();

  return new Set(
    value
      .split(",")
      .map((target) => target.trim())
      .filter(Boolean),
  );
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

function normalizePath(pathname) {
  if (!pathname.startsWith("/")) return `/${pathname}`;
  return pathname;
}

function buildEnvironmentSummary() {
  return {
    node: process.version,
    platform: `${os.type()} ${os.release()}`,
    arch: process.arch,
    cpu: os.cpus()[0]?.model ?? null,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function buildTargetEnv(target) {
  const appName = inferWorkspaceName(target);
  const envFromFiles = {
    ...readEnvFile(resolve(ROOT_DIR, ".env")),
    ...readEnvFile(resolve(ROOT_DIR, ".env.local")),
    ...readEnvFile(resolve(ROOT_DIR, "apps", appName, ".env")),
    ...readEnvFile(resolve(ROOT_DIR, "apps", appName, ".env.local")),
  };

  return {
    ...envFromFiles,
    ...process.env,
  };
}

function inferWorkspaceName(target) {
  const workspaceIndex = target.start?.indexOf("workspace") ?? -1;
  if (workspaceIndex >= 0 && target.start?.[workspaceIndex + 1]) {
    return target.start[workspaceIndex + 1];
  }

  return target.name;
}

function readEnvFile(pathname) {
  if (!existsSync(pathname)) return {};

  const values = {};
  for (const line of readFileSync(pathname, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    values[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }

  return values;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
