#!/usr/bin/env node

import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const ROOT_DIR = process.cwd();
const RUNS = toInt(process.env.LH_RUNS, 3);
const TARGET_PATH = normalizePath(process.env.LH_PATH ?? "/");
const PRESET = process.env.LH_PRESET ?? "desktop";
const CHROME_FLAGS = process.env.LH_CHROME_FLAGS ?? "--headless=new --no-sandbox";

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_DIR = resolve(ROOT_DIR, "perf-results", "lighthouse", TIMESTAMP);
const LATEST_PATH = resolve(ROOT_DIR, "perf-results", "lighthouse", "latest.json");

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
    startArgs: ["workspace", "sveltekit-lab", "preview", "--host", "127.0.0.1"],
  },
];

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const summary = {
    generatedAt: new Date().toISOString(),
    path: TARGET_PATH,
    runs: RUNS,
    preset: PRESET,
    chromeFlags: CHROME_FLAGS,
    targets: [],
  };

  for (const target of targets) {
    const url = `${target.baseUrl}${TARGET_PATH}`;
    console.log(`\n[${target.name}] build`);
    await runYarn(target.buildArgs);

    console.log(`[${target.name}] start server`);
    const server = spawn("yarn", target.startArgs, {
      cwd: ROOT_DIR,
      stdio: "inherit",
    });

    try {
      await waitForHttp(url);
      console.log(`[${target.name}] lighthouse x${RUNS} -> ${url}`);

      const runResults = [];
      for (let i = 1; i <= RUNS; i += 1) {
        const reportPath = resolve(OUTPUT_DIR, `${target.name}.run-${i}.json`);
        await runYarn([
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

async function runYarn(args) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn("yarn", args, { cwd: ROOT_DIR, stdio: "inherit" });
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
