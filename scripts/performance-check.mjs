#!/usr/bin/env node

import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import os from "node:os";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";

const ROOT_DIR = process.cwd();
const MIN_RUNS = toInt(process.env.PERF_MIN_RUNS, 5);
const DEFAULT_RUNS = Math.max(toInt(process.env.PERF_RUNS, 5), MIN_RUNS);
const LH_RUNS = Math.max(toInt(process.env.LH_RUNS, DEFAULT_RUNS), toInt(process.env.LH_MIN_RUNS, MIN_RUNS));
const SSR_RUNS = Math.max(
  toInt(process.env.SSR_RUNS, DEFAULT_RUNS),
  toInt(process.env.SSR_MIN_RUNS, MIN_RUNS),
);
const SSR_WARMUP = toInt(process.env.SSR_WARMUP, 3);
const LH_PATH = normalizePath(process.env.LH_PATH ?? process.env.PERF_PATH ?? "/");
const SSR_PATH = normalizePath(process.env.SSR_PATH ?? process.env.PERF_PATH ?? "/");
const SSR_EXPECT_TEXT = process.env.SSR_EXPECT_TEXT ?? "";
const LH_PRESET = process.env.LH_PRESET ?? "desktop";
const LH_CHROME_FLAGS = process.env.LH_CHROME_FLAGS ?? "--headless=new --no-sandbox";
const MODE = process.env.PERF_MODE ?? "parallel";
const TARGET_FILTER = parseTargetFilter(
  process.env.PERF_TARGETS ?? process.env.LH_TARGETS ?? process.env.SSR_TARGETS,
);

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_DIR = resolve(ROOT_DIR, "perf-results", "performance", TIMESTAMP);
const LATEST_PATH = resolve(ROOT_DIR, "perf-results", "performance", "latest.json");
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
  if (!["parallel", "sequential"].includes(MODE)) {
    throw new Error(`PERF_MODE must be "parallel" or "sequential": ${MODE}`);
  }

  const selectedTargets = readTargets().filter((target) => {
    return TARGET_FILTER.size === 0 || TARGET_FILTER.has(target.name);
  });

  if (selectedTargets.length === 0) {
    throw new Error(`No performance targets matched: ${[...TARGET_FILTER].join(", ")}`);
  }

  for (const target of selectedTargets) {
    await assertBaseUrlAvailable(target);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const summary = {
    generatedAt: new Date().toISOString(),
    mode: MODE,
    minRuns: MIN_RUNS,
    lighthouse: {
      path: LH_PATH,
      runs: LH_RUNS,
      preset: LH_PRESET,
      chromeFlags: LH_CHROME_FLAGS,
    },
    ssr: {
      path: SSR_PATH,
      runs: SSR_RUNS,
      warmup: SSR_WARMUP,
      expectedText: SSR_EXPECT_TEXT || null,
    },
    environment: buildEnvironmentSummary(),
    targets: [],
  };

  for (const target of selectedTargets) {
    const targetEnv = buildTargetEnv(target);
    const lighthouseUrl = `${target.baseUrl}${LH_PATH}`;
    const ssrUrl = `${target.baseUrl}${SSR_PATH}`;

    console.log(`\n[${target.name}] build`);
    await runCommand(target.build, { env: targetEnv });

    console.log(`[${target.name}] start server`);
    const server = spawnCommand(target.start, {
      cwd: ROOT_DIR,
      stdio: "inherit",
      env: targetEnv,
    });

    try {
      await waitForHttp(lighthouseUrl);
      if (ssrUrl !== lighthouseUrl) {
        await waitForHttp(ssrUrl);
      }

      const targetOutputDir = resolve(OUTPUT_DIR, target.name);
      mkdirSync(targetOutputDir, { recursive: true });

      const lighthouseTask = () => runLighthouseChecks(target, lighthouseUrl, targetOutputDir);
      const ssrTask = () => runSsrChecks(target, ssrUrl);

      const [lighthouse, ssr] =
        MODE === "parallel"
          ? await Promise.all([lighthouseTask(), ssrTask()])
          : [await lighthouseTask(), await ssrTask()];

      const targetSummary = {
        name: target.name,
        baseUrl: target.baseUrl,
        lighthouse,
        ssr,
      };

      writeFileSync(
        resolve(targetOutputDir, "summary.json"),
        JSON.stringify(targetSummary, null, 2),
      );
      summary.targets.push(targetSummary);
    } finally {
      await stopProcess(server);
    }
  }

  writeFileSync(resolve(OUTPUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));
  writeFileSync(LATEST_PATH, JSON.stringify(summary, null, 2));

  console.log(`\nSaved summary: ${resolve(OUTPUT_DIR, "summary.json")}`);
  console.log(`Updated latest: ${LATEST_PATH}`);
}

async function runLighthouseChecks(target, url, targetOutputDir) {
  console.log(`[${target.name}] lighthouse x${LH_RUNS} -> ${url}`);

  const runResults = [];
  for (let i = 1; i <= LH_RUNS; i += 1) {
    const reportPath = resolve(targetOutputDir, `lighthouse.run-${i}.json`);
    await runCommand([
      "yarn",
      "lighthouse",
      url,
      "--quiet",
      "--output=json",
      "--output-path",
      reportPath,
      "--only-categories=performance",
      `--preset=${LH_PRESET}`,
      `--chrome-flags=${LH_CHROME_FLAGS}`,
    ]);
    runResults.push(readLighthouseReport(reportPath, i));
  }

  const median = pickMedianLighthouseRun(runResults);

  return {
    url,
    medianRun: median.run,
    medianPerformanceScore: median.performanceScore,
    medianMetrics: median.metrics,
    runs: runResults,
  };
}

async function runSsrChecks(target, url) {
  if (SSR_WARMUP > 0) {
    console.log(`[${target.name}] SSR warmup x${SSR_WARMUP} -> ${url}`);
    for (let i = 1; i <= SSR_WARMUP; i += 1) {
      await measureSsrResponse(url, 0).catch(() => {});
    }
  }

  console.log(`[${target.name}] SSR response x${SSR_RUNS} -> ${url}`);

  const runResults = [];
  for (let i = 1; i <= SSR_RUNS; i += 1) {
    runResults.push(await measureSsrResponse(url, i));
  }

  const metricKeys = [
    "responseStartMs",
    "ttfbMs",
    "contentReadyMs",
    "totalMs",
    "htmlBytes",
  ];
  const medianMetrics = {};
  const distribution = {};

  for (const key of metricKeys) {
    medianMetrics[key] = medianNumber(runResults, key);
    distribution[key] = {
      min: minNumber(runResults, key),
      median: medianNumber(runResults, key),
      p95: percentileNumber(runResults, key, 95),
    };
  }

  const streamingDeltaMs =
    typeof medianMetrics.ttfbMs === "number" &&
    typeof medianMetrics.contentReadyMs === "number"
      ? round2(medianMetrics.contentReadyMs - medianMetrics.ttfbMs)
      : null;

  return {
    url,
    checklist: buildSsrChecklist(runResults),
    medianMetrics,
    distribution,
    streamingDeltaMs,
    runs: runResults,
  };
}

function readLighthouseReport(reportPath, run) {
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const performanceScore = round2((report.categories?.performance?.score ?? 0) * 100);
  const metrics = {
    fcpMs: lighthouseMetric(report, "first-contentful-paint"),
    lcpMs: lighthouseMetric(report, "largest-contentful-paint"),
    tbtMs: lighthouseMetric(report, "total-blocking-time"),
    cls: lighthouseMetric(report, "cumulative-layout-shift"),
    speedIndexMs: lighthouseMetric(report, "speed-index"),
    inpMs: lighthouseMetric(report, "interaction-to-next-paint"),
  };

  return {
    run,
    performanceScore,
    metrics,
  };
}

function lighthouseMetric(report, id) {
  const value = report.audits?.[id]?.numericValue;
  if (typeof value !== "number") return null;
  return round2(value);
}

function pickMedianLighthouseRun(results) {
  const sorted = [...results].sort((a, b) => a.performanceScore - b.performanceScore);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

async function measureSsrResponse(url, run) {
  const startedAt = performance.now();
  const response = await fetch(url, {
    redirect: "manual",
    headers: {
      accept: "text/html",
      "user-agent": "ui-lab-performance-check",
    },
  });
  const responseStartMs = performance.now() - startedAt;

  const chunks = [];
  let ttfbMs = null;
  let contentReadyMs = null;
  const decoder = new TextDecoder("utf-8");
  let decoded = "";

  const markContentReady = (bytes, elapsed) => {
    if (!SSR_EXPECT_TEXT || contentReadyMs !== null) return;
    decoded += decoder.decode(bytes, { stream: true });
    if (decoded.includes(SSR_EXPECT_TEXT)) {
      contentReadyMs = elapsed;
    }
  };

  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const elapsed = performance.now() - startedAt;
      if (ttfbMs === null) {
        ttfbMs = elapsed;
      }
      chunks.push(value);
      markContentReady(value, elapsed);
    }
  } else {
    const body = new Uint8Array(await response.arrayBuffer());
    if (body.byteLength > 0) {
      ttfbMs = performance.now() - startedAt;
      chunks.push(body);
      markContentReady(body, ttfbMs);
    }
  }

  const totalMs = performance.now() - startedAt;
  const htmlBuffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  const html = htmlBuffer.toString("utf8");
  const containsExpectedText = SSR_EXPECT_TEXT ? html.includes(SSR_EXPECT_TEXT) : null;

  return {
    run,
    status: response.status,
    ok: response.status >= 200 && response.status < 400,
    responseStartMs: round2(responseStartMs),
    ttfbMs: round2(ttfbMs ?? responseStartMs),
    contentReadyMs: contentReadyMs === null ? null : round2(contentReadyMs),
    totalMs: round2(totalMs),
    htmlBytes: htmlBuffer.byteLength,
    containsExpectedText,
  };
}

function buildSsrChecklist(runResults) {
  const statusOk = runResults.every((result) => result.ok);
  const expectedTextOk = SSR_EXPECT_TEXT
    ? runResults.every((result) => result.containsExpectedText === true)
    : null;
  const contentReadyOk = SSR_EXPECT_TEXT
    ? runResults.every((result) => typeof result.contentReadyMs === "number")
    : null;

  return {
    statusOk,
    expectedTextOk,
    contentReadyOk,
  };
}

function readTargets() {
  if (!existsSync(TARGETS_PATH)) return fallbackTargets;

  const payload = JSON.parse(readFileSync(TARGETS_PATH, "utf8"));
  const configuredTargets = Array.isArray(payload.targets) ? payload.targets : [];

  if (configuredTargets.length === 0) return fallbackTargets;
  return configuredTargets;
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

async function assertBaseUrlAvailable(target) {
  const url = new URL(target.baseUrl);
  const host = url.hostname;
  const port = Number(url.port);

  if (!port) {
    throw new Error(`Target ${target.name} must include an explicit port: ${target.baseUrl}`);
  }

  const isAvailable = await canListen(host, port);
  if (!isAvailable) {
    throw new Error(
      `Port ${port} is already in use for ${target.name}. Stop the existing server or filter targets with PERF_TARGETS before running perf:check.`,
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

function medianNumber(results, key) {
  const sorted = results
    .map((result) => result[key])
    .filter((value) => typeof value === "number")
    .sort((a, b) => a - b);

  if (sorted.length === 0) return null;
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

function minNumber(results, key) {
  const values = results
    .map((result) => result[key])
    .filter((value) => typeof value === "number");

  if (values.length === 0) return null;
  return Math.min(...values);
}

function percentileNumber(results, key, p) {
  const sorted = results
    .map((result) => result[key])
    .filter((value) => typeof value === "number")
    .sort((a, b) => a - b);

  if (sorted.length === 0) return null;
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  const index = Math.min(Math.max(rank, 0), sorted.length - 1);
  return sorted[index];
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

function round2(value) {
  return Math.round(value * 100) / 100;
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
