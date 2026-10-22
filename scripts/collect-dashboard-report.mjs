#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import reportData from '../apps/lab-shell/public/previews/responsive-layout/report-data.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const { FRAMEWORKS, STAT_METRICS, SCENARIO, METHOD, summarize, validateObservation, parseReport } = reportData;
const DEFAULT_OUTPUT = 'apps/lab-shell/public/previews/responsive-layout/reports/dashboard-ssr.json';
const sourceDirectories = [
  'apps/next-lab/app/scenarios/dashboard-ssr',
  'apps/react-router-lab/app/scenarios/dashboard-ssr',
  'apps/sveltekit-lab/src/routes/scenarios/dashboard-ssr',
  'apps/vue-lab/components/scenarios/dashboard-ssr',
  'apps/vue-lab/shared/scenarios/dashboard-ssr',
  'apps/lab-shell/app/ssr-lab/framework-dashboard/_lib',
  'apps/lab-shell/app/api/ssr-observer',
];
const sourcePaths = [
  // The dashboard renders inside these roots; include their imported providers/styles
  // and the configs that select routes, adapters, and compilation behavior.
  'apps/next-lab/app/layout.tsx',
  'apps/next-lab/app/providers/query-provider.tsx',
  'apps/next-lab/app/globals.css',
  'apps/next-lab/next.config.ts',
  'apps/next-lab/tsconfig.json',
  'apps/react-router-lab/app/root.tsx',
  'apps/react-router-lab/app/providers/query-provider.tsx',
  'apps/react-router-lab/app/styles/main.css',
  'apps/react-router-lab/app/routes.ts',
  'apps/react-router-lab/react-router.config.ts',
  'apps/react-router-lab/vite.config.ts',
  'apps/react-router-lab/tsconfig.json',
  'apps/sveltekit-lab/src/app.html',
  'apps/sveltekit-lab/src/routes/+layout.svelte',
  'apps/sveltekit-lab/src/routes/+layout.ts',
  'apps/sveltekit-lab/vite.config.ts',
  'apps/sveltekit-lab/tsconfig.json',
  'apps/vue-lab/app.vue',
  'apps/vue-lab/plugins/vue-query.ts',
  'apps/vue-lab/assets/css/main.css',
  'apps/vue-lab/nuxt.config.ts',
  'apps/vue-lab/tsconfig.json',
  // The observer is an API route, so its build config applies but its UI layout does not.
  'apps/lab-shell/next.config.ts',
  'apps/lab-shell/tsconfig.json',
  'apps/lab-shell/app/ssr-lab/framework-dashboard/source-catalog.ts',
  'apps/react-router-lab/app/routes/scenarios.dashboard-ssr.tsx',
  'apps/sveltekit-lab/src/lib/server/scenarios/dashboard-ssr.ts',
  'apps/vue-lab/pages/scenarios/dashboard-ssr.vue',
  'apps/vue-lab/server/api/scenarios/dashboard-ssr.get.ts',
  'apps/vue-lab/server/utils/scenarios/dashboard-ssr.ts',
  'scripts/collect-dashboard-report.mjs',
  'apps/lab-shell/public/previews/responsive-layout/report-data.js',
  'package.json', 'yarn.lock',
];

export function readBaseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname) || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('UI_LAB_BASE_URL은 경로·인증정보 없는 loopback HTTP origin이어야 합니다.');
  }
  return url.origin;
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

export async function collectSourceFiles(root = ROOT) {
  const paths = new Set(sourcePaths);
  async function visit(relative) {
    for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
      const child = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await visit(child);
      else if (entry.isFile()) paths.add(child);
      else throw new Error(`소스 기록은 일반 파일만 허용합니다: ${child}`);
    }
  }
  for (const directory of sourceDirectories) await visit(directory);
  for (const entry of await readdir(path.join(root, 'fixtures'), { withFileTypes: true })) {
    if (entry.isFile() && entry.name.startsWith('dashboard')) paths.add(`fixtures/${entry.name}`);
  }
  for (const parent of ['apps', 'packages']) {
    for (const entry of await readdir(path.join(root, parent), { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const candidate = `${parent}/${entry.name}/package.json`;
        try { await readFile(path.join(root, candidate)); paths.add(candidate); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
    }
  }
  const sourceFiles = [];
  for (const relative of [...paths].sort()) sourceFiles.push({ path: relative, sha256: sha256(await readFile(path.join(root, relative))) });
  return sourceFiles;
}

export async function collectProvenance(root = ROOT) {
  const sourceFiles = await collectSourceFiles(root);
  const gitCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd: root, encoding: 'utf8' }).length > 0;
  return { gitCommit, dirty, sourceDigest: sha256(JSON.stringify(sourceFiles)), sourceFiles };
}

export async function readObservation(baseUrl, id, fetchImpl = fetch) {
  const url = new URL(`/api/ssr-observer/${id}?team=alpha&delay=0`, baseUrl);
  const response = await fetchImpl(url, {
    cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(15_000),
    headers: { accept: 'application/json', 'cache-control': 'no-cache' },
  });
  if (response.status !== 200) throw new Error(`${id}: 관찰 API HTTP ${response.status}`);
  if (!/^application\/json(?:\s*;|\s*$)/i.test(response.headers.get('content-type') ?? '') || !/(?:^|,)\s*no-store(?:\s*(?:,|$))/i.test(response.headers.get('cache-control') ?? '')) {
    throw new Error(`${id}: JSON/no-store 관찰 응답이 필요합니다.`);
  }
  return validateObservation(await response.json(), id);
}

// Dependency injection supports deterministic tests; the CLI always uses actual fetch/Git/files.
export async function collectReport({ baseUrl = process.env.UI_LAB_BASE_URL ?? 'http://127.0.0.1:3003', provenanceReader = collectProvenance, fetchImpl = fetch, now = () => new Date().toISOString(), onProgress = () => {} } = {}) {
  const origin = readBaseUrl(baseUrl);
  const startedAt = now();
  const provenance = await provenanceReader();
  const targets = Object.entries(FRAMEWORKS).map(([id, label]) => ({ id, label, version: null, renderMode: 'blocking', path: SCENARIO.path, statistics: {}, samples: [] }));
  const sourceRecords = new Map();
  for (const phase of ['warmup', 'runs']) {
    for (let round = 0; round < METHOD[phase]; round += 1) {
      for (let position = 0; position < targets.length; position += 1) {
        const target = targets[(round + position) % targets.length];
        const observation = await readObservation(origin, target.id, fetchImpl);
        const source = JSON.stringify(observation.source);
        if (sourceRecords.has(target.id) && sourceRecords.get(target.id) !== source) throw new Error(`${target.id}: 수집 중 버전 또는 source가 바뀌었습니다.`);
        sourceRecords.set(target.id, source);
        target.version = observation.source.version;
        if (phase === 'runs') target.samples.push({ run: round + 1, observedAt: observation.observedAt, metrics: { ...observation.metrics } });
      }
      onProgress({ phase, round: round + 1, total: METHOD[phase] });
    }
  }
  const finalProvenance = await provenanceReader();
  if (provenance.gitCommit !== finalProvenance.gitCommit || provenance.sourceDigest !== finalProvenance.sourceDigest || JSON.stringify(provenance.sourceFiles) !== JSON.stringify(finalProvenance.sourceFiles)) {
    throw new Error('수집 중 소스 또는 Git 기준이 변경되어 결과를 저장하지 않습니다.');
  }
  for (const target of targets) {
    for (const key of STAT_METRICS) target.statistics[key] = summarize(target.samples.map((sample) => sample.metrics[key]));
  }
  return parseReport({
    schemaVersion: 1, id: 'dashboard-ssr', title: '대시보드 SSR · 반복 관찰 결과', generatedAt: now(), startedAt,
    scenario: { ...SCENARIO }, method: { ...METHOD },
    environment: { node: process.version, platform: `${os.type()} ${os.release()}`, arch: os.arch(), cpu: os.cpus()[0]?.model ?? 'unknown', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, network: 'loopback' },
    // This records collector-side files; deployment matching is verified separately before collection.
    provenance, targets,
  });
}

export async function collectAndWrite({ output = path.join(ROOT, DEFAULT_OUTPUT), ...options } = {}) {
  const report = await collectReport(options);
  const destination = path.resolve(output);
  const temporary = path.join(path.dirname(destination), `.${path.basename(destination)}.${randomUUID()}.tmp`);
  await mkdir(path.dirname(destination), { recursive: true });
  try {
    await writeFile(temporary, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }
  return report;
}

export function parseArguments(args) {
  if (args.length === 0) return {};
  if (args.length === 2 && args[0] === '--output' && args[1] && !args[1].startsWith('--')) return { output: path.resolve(args[1]) };
  throw new Error('사용법: node scripts/collect-dashboard-report.mjs [--output 파일경로]');
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const options = parseArguments(process.argv.slice(2));
    const report = await collectAndWrite({ ...options, onProgress: ({ phase, round, total }) => console.log(`${phase}: ${round}/${total} (4개 대상 순차 요청)`) });
    console.log(`저장 완료: ${options.output ?? path.join(ROOT, DEFAULT_OUTPUT)} · ${report.targets.length}개 프레임워크`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
