import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';
import reportData from '../apps/lab-shell/public/previews/responsive-layout/report-data.js';
import { collectAndWrite, collectProvenance, collectReport, collectSourceFiles, parseArguments, readBaseUrl, readObservation } from './collect-dashboard-report.mjs';

const { FRAMEWORKS, summarize, parseReport, validateObservation } = reportData;
const ids = Object.keys(FRAMEWORKS);
const time = '2026-10-22T01:00:00.000Z';
const sourceFiles = [{ path: 'fixtures/dashboard-ssr.json', sha256: 'a'.repeat(64) }];
const provenance = { gitCommit: 'b'.repeat(40), dirty: true, sourceDigest: createHash('sha256').update(JSON.stringify(sourceFiles)).digest('hex'), sourceFiles };

function observation(id, metrics = {}) {
  return {
    ok: true, framework: id, request: { team: 'alpha', delayMs: 0 }, observedAt: time,
    source: { label: FRAMEWORKS[id], version: '1.2.3', path: '/scenarios/dashboard-ssr', renderMode: 'blocking' },
    upstreamStatus: 200, error: null, html: '<main data-dashboard-ready="v1">fixture</main>',
    metrics: { responseStartMs: 1.111, firstByteMs: 2.222, contentReadyMs: 3.333, totalMs: 4.444, htmlBytes: 1024, ...metrics },
  };
}
function response(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } });
}
function options(overrides = {}) {
  return { baseUrl: 'http://127.0.0.1:3003', now: () => time, provenanceReader: async () => structuredClone(provenance), fetchImpl: async (url) => response(observation(url.pathname.split('/').at(-1))), ...overrides };
}

test('중앙값은 가운데 두 값의 평균, p95는 nearest-rank이며 집계 끝에서만 반올림한다', () => {
  assert.deepEqual(summarize([4, 1, 3, 2]), { min: 1, median: 2.5, p95: 4 });
  assert.deepEqual(summarize(Array.from({ length: 20 }, (_, i) => i + 1)), { min: 1, median: 10.5, p95: 19 });
  assert.equal(summarize([1.004, 1.014]).median, 1.01);
  assert.deepEqual(summarize([7.123]), { min: 7.12, median: 7.12, p95: 7.12 });
  for (const values of [[], [null], [NaN], [Infinity], [-1], ['2']]) assert.throws(() => summarize(values));
});

test('브라우저와 Node가 같은 parseReport 계약을 사용한다', async () => {
  const value = await collectReport(options());
  const source = await readFile(new URL('../apps/lab-shell/public/previews/responsive-layout/report-data.js', import.meta.url), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source, context);
  assert.equal(context.UI_LAB_REPORT_DATA.parseReport(value), value);
  assert.equal(parseReport(value), value);
  assert.throws(() => context.UI_LAB_REPORT_DATA.parseReport({ ...value, schemaVersion: 2 }));
});

test('각 대상 warmup 3회와 실제 20회를 동시 요청 없이 회차마다 순서를 바꿔 수집한다', async () => {
  const calls = [];
  let active = 0;
  const report = await collectReport(options({ fetchImpl: async (url, init) => {
    assert.equal(active++, 0, '이전 요청이 끝나기 전에 다음 요청을 시작하면 안 됩니다.');
    assert.equal(init.redirect, 'manual');
    assert.equal(init.cache, 'no-store');
    assert.equal(url.search, '?team=alpha&delay=0');
    const id = url.pathname.split('/').at(-1);
    calls.push(id);
    await Promise.resolve();
    active--;
    return response(observation(id));
  } }));
  const expected = [];
  for (const count of [3, 20]) for (let round = 0; round < count; round++) for (let position = 0; position < 4; position++) expected.push(ids[(round + position) % 4]);
  assert.deepEqual(calls, expected);
  for (const target of report.targets) {
    assert.equal(calls.filter((id) => id === target.id).length, 23);
    assert.equal(target.samples.length, 20);
    assert.equal(target.samples[0].metrics.firstByteMs, 2.222, 'API가 준 samples는 다시 반올림하지 않습니다.');
    assert.equal(target.statistics.firstByteMs.median, 2.22);
    assert.equal(Object.hasOwn(target, 'html'), false);
  }
  assert.doesNotMatch(JSON.stringify(report), /<main|fixture<\/main>/);
});

test('부족한 표본·중복 대상·조건 혼합·통계 불일치·비정상 수치를 거부한다', async () => {
  const good = await collectReport(options());
  const invalid = [
    (r) => { delete r.method; },
    (r) => { r.targets[1] = structuredClone(r.targets[0]); },
    (r) => { r.targets.pop(); },
    (r) => { r.scenario.delayMs = 400; },
    (r) => { r.method.runs = 1; },
    (r) => { r.method.order = 'parallel'; },
    (r) => { r.targets[0].path = '/other'; },
    (r) => { r.targets[0].renderMode = 'streaming'; },
    (r) => { r.targets[0].samples.pop(); },
    (r) => { r.targets[0].samples[1].run = 1; },
    (r) => { r.targets[0].samples[0].metrics.contentReadyMs = null; },
    (r) => { r.targets[0].samples[0].metrics.totalMs = 0; },
    (r) => { r.targets[0].samples[0].metrics.htmlBytes = 1.1; },
    (r) => { r.targets[0].samples[0].observedAt = '2026-10-23T01:00:00.000Z'; },
    (r) => { r.targets[0].samples[0].html = '<main>raw</main>'; },
    (r) => { r.targets[0].version = '^1.2.3'; },
    (r) => { r.targets[0].statistics.totalMs.p95 += 1; },
    (r) => { r.provenance.sourceFiles.push(structuredClone(r.provenance.sourceFiles[0])); },
    (r) => { r.provenance.sourceFiles[0].path = '../secret'; },
    (r) => { r.environment.network = 'remote'; },
  ];
  for (const mutate of invalid) {
    const value = structuredClone(good);
    mutate(value);
    assert.throws(() => parseReport(value), mutate.toString());
  }
});

test('HTTP 오류와 실패 관찰·다른 조건·nullable 수치·잘못된 source를 거부한다', async () => {
  for (const settings of [{ status: 503 }, { headers: { 'content-type': 'text/html' } }, { headers: { 'cache-control': 'public' } }]) {
    await assert.rejects(readObservation('http://127.0.0.1:3003', 'next', async () => response(observation('next'), settings)));
  }
  for (const mutate of [
    (r) => { r.ok = false; }, (r) => { r.framework = 'nuxt'; }, (r) => { r.upstreamStatus = 404; },
    (r) => { r.request.team = 'empty'; }, (r) => { r.source.path = '/other'; },
    (r) => { r.metrics.firstByteMs = null; }, (r) => { r.metrics.totalMs = Infinity; },
    (r) => { r.error = { code: 'offline' }; }, (r) => { r.html = null; },
  ]) {
    const value = observation('next'); mutate(value);
    assert.throws(() => validateObservation(value, 'next'));
  }
});

test('warmup 이후의 설치 버전 변경 및 수집 중 소스 변경을 거부한다', async () => {
  let calls = 0;
  await assert.rejects(collectReport(options({ fetchImpl: async (url) => {
    const value = observation(url.pathname.split('/').at(-1));
    if (++calls > 12) value.source.version = '1.2.4';
    return response(value);
  } })), /버전 또는 source/);
  let reads = 0;
  await assert.rejects(collectReport(options({ provenanceReader: async () => ({ ...structuredClone(provenance), sourceDigest: (++reads === 1 ? 'a' : 'c').repeat(64) }) })), /수집 중 소스/);
});

test('수집 실패는 기존 결과를 보존하고 성공 시 완성된 JSON으로 교체한다', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'ui-lab-report-test-'));
  const output = path.join(directory, 'report.json');
  try {
    await writeFile(output, 'previous report\n');
    await assert.rejects(collectAndWrite({ output, ...options({ fetchImpl: async () => { throw new Error('offline'); } }) }), /offline/);
    assert.equal(await readFile(output, 'utf8'), 'previous report\n');
    assert.deepEqual(await readdir(directory), ['report.json']);
    await collectAndWrite({ output, ...options() });
    assert.equal(parseReport(JSON.parse(await readFile(output, 'utf8'))).id, 'dashboard-ssr');
    assert.deepEqual(await readdir(directory), ['report.json']);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('실제 소스 provenance는 정렬된 파일 해시와 재계산 가능한 digest를 기록한다', async () => {
  const value = await collectProvenance();
  const paths = value.sourceFiles.map((file) => file.path);
  assert.deepEqual(paths, [...new Set(paths)].sort());
  for (const required of ['yarn.lock', 'package.json', 'fixtures/dashboard-ssr.json', 'fixtures/dashboard-ssr.css', 'apps/react-router-lab/app/routes/scenarios.dashboard-ssr.tsx', 'apps/lab-shell/app/api/ssr-observer/[framework]/route.ts']) assert.ok(paths.includes(required), required);
  for (const file of value.sourceFiles) {
    const contents = await readFile(new URL(`../${file.path}`, import.meta.url));
    assert.equal(file.sha256, createHash('sha256').update(contents).digest('hex'));
  }
  assert.equal(value.sourceDigest, createHash('sha256').update(JSON.stringify(value.sourceFiles)).digest('hex'));
});

test('실제 SSR 루트·provider·설정 변경을 출처 해시에서 감지하고 수집 중 변경은 거부한다', async () => {
  const files = await collectSourceFiles();
  const paths = files.map((file) => file.path);
  const runtimeSources = [
    'apps/next-lab/app/layout.tsx', 'apps/next-lab/app/providers/query-provider.tsx', 'apps/next-lab/app/globals.css', 'apps/next-lab/next.config.ts', 'apps/next-lab/tsconfig.json',
    'apps/react-router-lab/app/root.tsx', 'apps/react-router-lab/app/providers/query-provider.tsx', 'apps/react-router-lab/app/styles/main.css', 'apps/react-router-lab/app/routes.ts', 'apps/react-router-lab/react-router.config.ts', 'apps/react-router-lab/vite.config.ts', 'apps/react-router-lab/tsconfig.json',
    'apps/sveltekit-lab/src/app.html', 'apps/sveltekit-lab/src/routes/+layout.svelte', 'apps/sveltekit-lab/src/routes/+layout.ts', 'apps/sveltekit-lab/vite.config.ts', 'apps/sveltekit-lab/tsconfig.json',
    'apps/vue-lab/app.vue', 'apps/vue-lab/plugins/vue-query.ts', 'apps/vue-lab/assets/css/main.css', 'apps/vue-lab/nuxt.config.ts', 'apps/vue-lab/tsconfig.json',
    'apps/lab-shell/next.config.ts', 'apps/lab-shell/tsconfig.json', 'apps/lab-shell/app/ssr-lab/framework-dashboard/source-catalog.ts',
  ];
  runtimeSources.forEach((file) => assert.ok(paths.includes(file), `실제 SSR 의존성 누락: ${file}`));
  assert.ok(!paths.includes('apps/lab-shell/app/layout.tsx'), '관찰 API에서 실행되지 않는 UI layout은 포함하지 않습니다.');
  assert.ok(!paths.some((file) => file.includes('/shopping-detail-ssr/')), '관련 없는 시나리오 전체를 수집하지 않습니다.');

  const directory = await mkdtemp(path.join(os.tmpdir(), 'ui-lab-provenance-test-'));
  try {
    for (const file of files) {
      const destination = path.join(directory, file.path);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, await readFile(new URL(`../${file.path}`, import.meta.url)));
    }
    const before = await collectSourceFiles(directory);
    assert.deepEqual(before, files);
    const changedPath = 'apps/next-lab/app/layout.tsx';
    const original = await readFile(path.join(directory, changedPath), 'utf8');
    await writeFile(path.join(directory, changedPath), `${original}\n// 이 테스트의 루트 변경\n`);
    const after = await collectSourceFiles(directory);
    assert.notEqual(before.find((file) => file.path === changedPath).sha256, after.find((file) => file.path === changedPath).sha256);
    assert.deepEqual(before.filter((file) => file.path !== changedPath), after.filter((file) => file.path !== changedPath));
    let reads = 0;
    await assert.rejects(collectReport(options({ provenanceReader: async () => {
      const sourceFiles = reads++ === 0 ? before : after;
      return { ...provenance, sourceFiles, sourceDigest: createHash('sha256').update(JSON.stringify(sourceFiles)).digest('hex') };
    } })), /수집 중 소스/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('CLI는 loopback HTTP만 허용하고 알려진 인자만 받는다', () => {
  for (const url of ['http://127.0.0.1:3003', 'http://localhost:3003/', 'http://[::1]:3003']) assert.equal(readBaseUrl(url), new URL(url).origin);
  for (const url of ['https://127.0.0.1:3003', 'http://example.com', 'http://user:pass@localhost:3003', 'http://localhost:3003/path', 'http://localhost:3003/?x=1']) assert.throws(() => readBaseUrl(url));
  assert.deepEqual(parseArguments([]), {});
  assert.equal(parseArguments(['--output', '/tmp/example.json']).output, '/tmp/example.json');
  for (const args of [['--output'], ['--runs', '1'], ['--output', 'a', '--output', 'b']]) assert.throws(() => parseArguments(args));
});
