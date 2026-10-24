#!/usr/bin/env node

import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import os from "node:os";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";
import { captureSource, captureTargetVersions, savePerformanceHistory } from "./performance-history.mjs";
import { createThrottledProxy, prepareBackendNetwork, readNetworkProfile } from "./performance-network.mjs";

const ROOT_DIR = process.cwd();
const OUTPUT_ROOT = process.env.PERF_OUTPUT_ROOT ?? ROOT_DIR;
const NETWORK = readNetworkProfile();
const MIN_RUNS = toInt(process.env.SSR_MIN_RUNS, 5);
const RUNS = Math.max(toInt(process.env.SSR_RUNS, 5), MIN_RUNS);
const WARMUP = toInt(process.env.SSR_WARMUP, 3);
const TARGET_PATH = normalizePath(process.env.SSR_PATH ?? "/");
const EXPECT_TEXT = process.env.SSR_EXPECT_TEXT ?? "";
const TARGET_FILTER = parseTargetFilter(process.env.SSR_TARGETS);

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_DIR = resolve(OUTPUT_ROOT, "perf-results", "ssr", TIMESTAMP);
const LATEST_PATH = resolve(OUTPUT_ROOT, "perf-results", "ssr", "latest.json");

const targets = [
  {
    name: "next-lab",
    baseUrl: "http://127.0.0.1:3001",
    buildArgs: ["workspace", "next-lab", "build"],
    startArgs: ["workspace", "next-lab", "start"],
  },
  {
    name: "sveltekit-lab",
    baseUrl: "http://127.0.0.1:3002",
    buildArgs: ["workspace", "sveltekit-lab", "build"],
    startArgs: ["workspace", "sveltekit-lab", "preview"],
  },
  {
    name: "vue-lab",
    baseUrl: "http://127.0.0.1:3004",
    buildArgs: ["workspace", "vue-lab", "build"],
    startArgs: ["workspace", "vue-lab", "preview"],
  },
  {
    name: "react-router-lab",
    baseUrl: "http://127.0.0.1:3005",
    buildArgs: ["workspace", "react-router-lab", "build"],
    startArgs: ["workspace", "react-router-lab", "preview"],
  },
];

async function main() {
  const configuredTargets = process.env.PERF_TARGETS_PATH
    ? JSON.parse(readFileSync(process.env.PERF_TARGETS_PATH, "utf8")).targets.map((target) => ({ ...target, buildArgs: target.build.slice(1), startCommand: target.start }))
    : targets;
  const selectedTargets = configuredTargets.filter((target) => {
    return TARGET_FILTER.size === 0 || TARGET_FILTER.has(target.name);
  });

  if (selectedTargets.length === 0) {
    throw new Error(`No SSR targets matched: ${[...TARGET_FILTER].join(", ")}`);
  }

  for (const target of selectedTargets) {
    await assertBaseUrlAvailable(target);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const summary = {
    generatedAt: new Date().toISOString(),
    source: captureSource(ROOT_DIR),
    path: TARGET_PATH,
    runs: RUNS,
    minRuns: MIN_RUNS,
    warmup: WARMUP,
    expectedText: EXPECT_TEXT || null,
    network: NETWORK,
    comparison: process.env.PERF_COMPARISON_ID ? { id: process.env.PERF_COMPARISON_ID, cohort: process.env.PERF_COHORT ?? "current", harnessSha256: process.env.PERF_HARNESS_SHA256 ?? null } : null,
    environment: {
      node: process.version,
      platform: `${os.type()} ${os.release()}`,
      arch: process.arch,
      cpu: os.cpus()[0]?.model ?? null,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    targets: [],
  };

  for (const target of selectedTargets) {
    const url = `${target.baseUrl}${TARGET_PATH}`;
    const versionInfo = captureTargetVersions(ROOT_DIR, target.name);

    const backend = await prepareBackendNetwork(buildTargetEnv(target), NETWORK);
    let server;
    let proxy;
    try {
      console.log(`\n[${target.name}] build`);
      await runYarn(target.buildArgs, { env: backend.env });

      console.log(`[${target.name}] start server`);
      const [binary, ...startArgs] = target.startCommand ?? ["yarn", ...target.startArgs];
      server = spawn(binary, startArgs, {
        cwd: ROOT_DIR,
        stdio: "inherit",
        env: backend.env,
      });

      await waitForHttp(url);
      proxy = NETWORK ? await createThrottledProxy(target.baseUrl, NETWORK) : null;
      const measuredUrl = proxy ? `${proxy.url}${TARGET_PATH}` : url;

      if (WARMUP > 0) {
        console.log(`[${target.name}] warmup x${WARMUP} -> ${url}`);
        for (let i = 1; i <= WARMUP; i += 1) {
          const warmup = await measureSsrResponse(measuredUrl, 0);
          if (!warmup.ok) throw new Error(`Warmup HTTP ${warmup.status}`);
        }
      }

      console.log(`[${target.name}] SSR response x${RUNS} -> ${url}`);

      const runResults = [];
      for (let i = 1; i <= RUNS; i += 1) {
        runResults.push(await measureSsrResponse(measuredUrl, i));
      }

      const checklist = buildChecklist(runResults);
      if (Object.values(checklist).some((value) => value === false)) throw new Error(`${target.name}: SSR content/status check failed`);

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

      const targetSummary = {
        name: target.name,
        ...versionInfo,
        url,
        checklist,
        medianMetrics,
        distribution,
        streamingDeltaMs,
        runs: runResults,
        backendRequests: backend.stats,
        proxyRequests: proxy?.stats ?? [],
      };

      writeFileSync(
        resolve(OUTPUT_DIR, `${target.name}.json`),
        JSON.stringify(targetSummary, null, 2),
      );
      summary.targets.push(targetSummary);
    } finally {
      if (server) await stopProcess(server);
      if (proxy) await proxy.close();
      await backend.close();
    }
  }

  writeFileSync(resolve(OUTPUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));
  if (process.env.PERF_UPDATE_LATEST !== "0") writeFileSync(LATEST_PATH, JSON.stringify(summary, null, 2));
  savePerformanceHistory(OUTPUT_ROOT, "ssr", summary);

  console.log(`\nSaved summary: ${resolve(OUTPUT_DIR, "summary.json")}`);
  if (process.env.PERF_UPDATE_LATEST !== "0") console.log(`Updated latest: ${LATEST_PATH}`);
}

async function measureSsrResponse(url, run) {
  const startedAt = performance.now();
  const response = await fetch(url, {
    redirect: "manual",
    headers: {
      accept: "text/html",
      "user-agent": "ui-lab-ssr-compare",
    },
  });
  const responseStartMs = performance.now() - startedAt;

  const chunks = [];
  let ttfbMs = null;
  let contentReadyMs = null;
  const decoder = new TextDecoder("utf-8");
  let decoded = "";

  // contentReadyMs는 EXPECT_TEXT가 byte stream에 처음 등장한 시각입니다.
  // 스트리밍 프레임워크는 셸을 먼저 보내므로 ttfb와 분리해서 측정합니다.
  const markContentReady = (bytes, elapsed) => {
    if (!EXPECT_TEXT || contentReadyMs !== null) return;
    decoded += decoder.decode(bytes, { stream: true });
    if (decoded.includes(EXPECT_TEXT)) {
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
  const containsExpectedText = EXPECT_TEXT ? html.includes(EXPECT_TEXT) : null;

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

function buildChecklist(runResults) {
  const statusOk = runResults.every((result) => result.ok);
  const expectedTextOk = EXPECT_TEXT
    ? runResults.every((result) => result.containsExpectedText === true)
    : null;
  const contentReadyOk = EXPECT_TEXT
    ? runResults.every((result) => typeof result.contentReadyMs === "number")
    : null;

  return {
    statusOk,
    expectedTextOk,
    contentReadyOk,
  };
}

async function waitForHttp(url, timeoutMs = 90_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.ok) { await response.arrayBuffer(); return; }
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
      `Port ${port} is already in use for ${target.name}. Stop the existing server or filter targets with SSR_TARGETS before running perf:ssr.`,
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

async function runYarn(args, options = {}) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn("yarn", args, { cwd: ROOT_DIR, stdio: "inherit", ...options });
    child.on("error", rejectPromise);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`yarn ${args.join(" ")} failed with code ${code}`));
    });
  });
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
  const workspaceIndex = target.startArgs?.indexOf("workspace") ?? -1;
  if (workspaceIndex >= 0 && target.startArgs?.[workspaceIndex + 1]) {
    return target.startArgs[workspaceIndex + 1];
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
