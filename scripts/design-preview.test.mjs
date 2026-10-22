import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { createContext, runInContext } from 'node:vm';

const base = new URL('../apps/lab-shell/public/previews/responsive-layout/', import.meta.url);
const logDirectory = new URL('../docs/upgrade-logs/', import.meta.url);
const summaries = readdirSync(logDirectory).filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(new URL(file, logDirectory), 'utf8')))
  .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt) || b.id.localeCompare(a.id))
  .map((log) => ({
    id: log.id, title: log.title, summary: log.summary, startedAt: log.startedAt, status: log.status,
    primary: { name: log.packages[0].name, before: log.packages[0].installedBefore, after: log.packages[0].installedAfter ?? '확인 중' },
    changeCount: log.changes.length,
    fileCount: new Set(log.changes.flatMap((change) => change.files.map((file) => file.path))).size,
    sourceCount: log.sources.length,
  }));
function createPreview(additions = {}) {
  const context = createContext({ window: {}, URL, AbortController, setTimeout, clearTimeout, ...additions });
  for (const file of ['comparison-manifest.js', 'upgrade-pages.js', 'catalog-pages.js', 'feature-pages.js', 'ssr-preview.js', 'infinite-scroll-pages.js', 'report-data.js', 'report-pages.js', 'routes.js']) {
    runInContext(readFileSync(new URL(file, base), 'utf8'), context, { filename: file });
  }
  return context;
}
const context = createPreview();
context.window.UI_LAB_UPGRADE_LOGS.setLogs(summaries);
const { pages, sections, resolve } = context.window.UI_LAB_ROUTES;
const internalLinks = (body) => [...body.matchAll(/href=["']#(\/[^"']*)["']/g)].map((match) => match[1]);

test('every detail belongs to its category and has a valid parent', () => {
  for (const [path, page] of Object.entries(pages)) {
    assert.equal(path.split('/')[1], page.nav, path);
    if (page.parentPath) {
      assert.ok(pages[page.parentPath], path);
      assert.equal(pages[page.parentPath].nav, page.nav, path);
      assert.equal(page.parent, pages[page.parentPath].title, path);
    }
  }
});

test('page content never sends visitors to a different menu or a missing page', () => {
  for (const [path, page] of Object.entries(pages)) {
    for (const href of internalLinks(page.body)) {
      assert.ok(pages[href], `${path} links to missing page ${href}`);
      assert.equal(pages[href].nav, page.nav, `${path} links across menus to ${href}`);
    }
  }
});

test('each catalog item opens its own child, rather than a shared unrelated screen', () => {
  for (const key of ['lab', 'features', 'reports', 'upgrades']) {
    const section = sections[key];
    const links = internalLinks(pages[section.path].body);
    const children = section.children.map((child) => child.path);
    assert.equal(links.length, new Set(links).size, `${key} has duplicate destinations`);
    assert.deepEqual([...links].sort(), [...children].sort(), key);
  }
  assert.equal(sections.lab.children.length, 1);
  assert.equal(sections.features.children.length, 4);
  assert.equal(sections.reports.children.length, 2);
  assert.equal(sections.upgrades.children.length, summaries.length);
});

test('infinite scroll reuses the four existing screens under its own laboratory parent', () => {
  const base = '/lab/infinite-scroll';
  const views = ['', '/adapter-live', '/adapter-view', '/hook'];
  for (const suffix of views) {
    const page = pages[`${base}${suffix}`];
    assert.equal(page.nav, 'lab');
    assert.equal(page.parentPath, suffix ? base : '/lab');
    assert.ok(page.body.includes(`data-source="/preview-embed/infinite-scroll${suffix}"`));
    assert.deepEqual(internalLinks(page.body), views.map((view) => `${base}${view}`));
  }
  const item = sections.lab.children.find((child) => child.path === base);
  assert.deepEqual([...item.children].map((child) => child.path), views.slice(1).map((view) => `${base}${view}`));
  assert.equal(resolve(`${base}?page=5`).path, base);
  assert.equal(resolve(`${base}?page=5`).search, 'page=5');
  assert.equal(resolve(`${base}/adapter-live?p=3`).search, 'p=3');
});

test('legacy links resolve to their corrected categories without losing query parameters', () => {
  assert.equal(resolve('/experiments/ssr').path, '/features/frameworks/shopping-detail-ssr');
  assert.equal(resolve('/lab/optimistic').path, '/features/react/optimistic');
  assert.equal(resolve('/lab/list').path, '/features/libraries/virtual-list');
  assert.equal(resolve('/features/rsc').path, '/features/nextjs/rsc-vs-csc');
  assert.equal(resolve('/features/missing').nav, 'features');
  assert.equal(resolve('/features/missing').parentPath, '/features');
  assert.equal(resolve('/reports/ssr/').path, '/reports/ssr');
  assert.equal(resolve('').path, '/lab');
});


test('only the user-defined infinite-scroll experiment belongs to the laboratory', () => {
  for (const path of Object.keys(pages).filter((path) => path.startsWith('/lab/'))) {
    assert.ok(path === '/lab/infinite-scroll' || path.startsWith('/lab/infinite-scroll/'), path);
  }
  assert.deepEqual([...sections.features.children].map((child) => child.path), [
    '/features/react', '/features/nextjs', '/features/libraries', '/features/frameworks',
  ]);
  for (const group of sections.features.children) {
    const links = internalLinks(pages[group.path].body);
    assert.deepEqual([...links].sort(), [...group.children].map((child) => child.path).sort(), group.path);
  }
});

test('implemented comparisons, planned work, and visual prototypes stay distinct', () => {
  const implemented = Object.values(pages).filter((page) => page.contentStatus === 'implemented');
  assert.deepEqual(implemented.map((page) => page.path).sort(), [
    '/features/frameworks/data-loading', '/features/frameworks/framework-dashboard', '/features/nextjs/rsc-vs-csc', '/features/nextjs/client-prerender', '/features/nextjs/request-cache', '/features/nextjs/server-actions', '/features/nextjs/streaming',
    '/features/libraries/virtual-list', '/features/libraries/cache',
    '/features/react/activity', '/features/react/deferred-value', '/features/react/effect-event', '/features/react/form-actions', '/features/react/optimistic',
  ].sort());
  for (const page of implemented) {
    const source = page.path.startsWith("/features/frameworks/") ? `/preview-embed/ssr/${page.path.split("/").at(-1)}` : `/preview-embed${page.path}`;
    assert.ok(page.body.includes(`data-source="${source}"`), page.path);
  }
  const prototypes = Object.values(pages).filter((page) => page.contentStatus === 'prototype');
  assert.equal(prototypes.length, 1);
  assert.ok(prototypes.every((page) => page.nav === 'features' && page.statusDescription));
  for (const [group, count] of [['react', 1], ['nextjs', 2]]) {
    const body = pages[`/features/${group}`].body;
    const planned = [...body.matchAll(/<article[^>]*data-status="planned"[^>]*>([\s\S]*?)<\/article>/g)];
    assert.equal(planned.length, count);
    assert.ok(planned.every((match) => !match[1].includes('href=')));
  }
});


test('every executable comparison has concise keywords and an observation prompt', () => {
  for (const page of Object.values(pages).filter((page) => page.contentStatus === 'implemented')) {
    assert.equal(page.keywords.length, 3, page.path);
    assert.ok(page.keywords.every((keyword) => keyword.length <= 15), page.path);
    assert.ok(page.observe?.length > 10, page.path);
  }
  assert.equal(resolve('/features/react/form-preview').path, '/features/react/form-actions');
});

test('server log order, source metadata, and canonical detail URLs reach the list and sidebar', () => {
  assert.deepEqual([...sections.upgrades.children].map((child) => child.path), summaries.map((log) => `/upgrades/${log.id}`));
  for (const log of summaries) {
    const page = resolve(`/upgrades/${log.id}`);
    assert.equal(page.title, log.title);
    assert.equal(page.description, log.summary);
    assert.ok(page.body.includes(`data-source="/preview-embed/upgrades/${log.id}"`));
    assert.ok(page.body.includes(`코드 비교 ${log.fileCount}개 파일`));
    assert.equal(page.keywords.length, 3);
  }
  for (const [alias, id] of Object.entries(context.window.UI_LAB_UPGRADE_LOGS.aliases)) {
    assert.equal(resolve(`/upgrades/${alias}`).path, `/upgrades/${id}`);
    assert.equal(resolve(`/upgrades/${alias}?from=old`).search, 'from=old');
  }
});

test('new, removed, and empty logs update only upgrade routes without stale object references', () => {
  const fresh = createPreview();
  const store = fresh.window.UI_LAB_UPGRADE_LOGS;
  const routes = fresh.window.UI_LAB_ROUTES;
  const pages = routes.pages;
  const sections = routes.sections;
  const feature = pages['/features/react/form-actions'];
  assert.match(routes.resolve('/upgrades/unknown').body, /불러오는 중/);
  store.setLogs(summaries);
  const extra = { ...summaries[0], id: '2026-10-22-test-record', title: '추가된 실제 형식 기록' };
  store.setLogs([extra, ...summaries.slice(1)]);
  assert.equal(routes.pages, pages);
  assert.equal(routes.sections, sections);
  assert.equal(pages['/features/react/form-actions'], feature);
  assert.equal(sections.upgrades.children[0].path, `/upgrades/${extra.id}`);
  assert.equal(routes.resolve(`/upgrades/${extra.id}`).title, extra.title);
  assert.equal(pages[`/upgrades/${summaries[0].id}`], undefined);
  assert.match(routes.resolve(`/upgrades/${summaries[0].id}`).title, /찾을 수 없습니다/);
  store.setLogs([]);
  assert.equal(sections.upgrades.children.length, 0);
  assert.match(pages['/upgrades'].body, /아직 버전업 기록이 없습니다/);
  assert.equal(pages['/features/react/form-actions'], feature);
});

test('log metadata is escaped and invalid index payloads cannot replace usable routes', () => {
  const fresh = createPreview();
  const store = fresh.window.UI_LAB_UPGRADE_LOGS;
  const dangerous = '<img src=x onerror="alert(1)"> & \'quoted\'';
  const log = { ...summaries[0], title: dangerous, summary: dangerous, primary: { name: dangerous, before: dangerous, after: dangerous } };
  store.setLogs([log]);
  const body = store.listPage.body + fresh.window.UI_LAB_ROUTES.resolve(`/upgrades/${log.id}`).body;
  assert.doesNotMatch(body, /<img|onerror="alert/);
  assert.match(body, /&lt;img/);
  assert.match(body, /&quot;/);
  assert.match(body, /&#39;/);
  for (const invalid of [null, [log, log], [{ ...log, id: '../bad' }], [{ ...log, status: 'unknown' }], [{ ...log, fileCount: -1 }]]) {
    assert.throws(() => store.setLogs(invalid), /Invalid upgrade/);
    assert.equal(store.getState().logs[0].title, dangerous);
  }
});

test('index failure, retry, and concurrent loading use fresh reads without blocking routes', async () => {
  const requests = [];
  let resolveRequest;
  const fresh = createPreview({ fetch: (url, options) => {
    requests.push({ url, options });
    return new Promise((resolve) => { resolveRequest = resolve; });
  } });
  const store = fresh.window.UI_LAB_UPGRADE_LOGS;
  const first = store.load();
  assert.equal(store.load(), first);
  await Promise.resolve();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, '/api/upgrade-logs');
  assert.equal(requests[0].options.cache, 'no-store');
  assert.equal(fresh.window.UI_LAB_ROUTES.resolve('/features/react/form-actions').title, pages['/features/react/form-actions'].title);
  resolveRequest({ ok: false });
  await first;
  assert.equal(store.getState().status, 'error');
  assert.match(store.listPage.body, /data-upgrade-index-retry/);
  const second = store.load();
  await Promise.resolve();
  assert.equal(requests.length, 2);
  assert.notEqual(requests[0].options.signal, requests[1].options.signal);
  resolveRequest({ ok: true, json: async () => ({ logs: summaries }) });
  await second;
  assert.equal(store.getState().status, 'ready');
  assert.equal(fresh.window.UI_LAB_ROUTES.sections.upgrades.children.length, summaries.length);
});

function createShellWithPendingIndex(hash) {
  let finishIndex;
  const fakeElement = () => ({
    dataset: {}, classList: { remove() {}, toggle() {} },
    addEventListener() {}, append() {}, replaceChildren() {},
    querySelector: () => null, querySelectorAll: () => [],
    setAttribute() {}, removeAttribute() {}, focus() {},
  });
  const content = fakeElement();
  const calls = { renders: 0, navigationReads: 0, closes: 0, scrolls: 0 };
  const main = fakeElement();
  Object.defineProperty(main, 'innerHTML', { set() { calls.renders += 1; } });
  main.querySelector = (selector) => selector === '#page-content' ? content : null;
  const dialog = { ...fakeElement(), open: false, close() { calls.closes += 1; this.open = false; } };
  const elements = new Map([['#main', main], ['#menu-dialog', dialog]]);
  const document = { createElement: fakeElement, querySelectorAll(selector) {
    if (selector.includes('data-nav') || selector === '.nav-subitems') calls.navigationReads += 1;
    return [];
  }, querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, fakeElement());
    return elements.get(selector);
  } };
  const window = { innerWidth: 390, addEventListener() {}, scrollTo() { calls.scrolls += 1; } };
  const fresh = createPreview({ window, document, location: { hash }, history: { replaceState() {} }, fetch: () => new Promise((resolve) => { finishIndex = resolve; }) });
  return {
    fresh, dialog, calls,
    start() { runInContext(readFileSync(new URL('preview.js', base), 'utf8'), fresh, { filename: 'preview.js' }); },
    finish() { finishIndex({ ok: true, json: async () => ({ logs: summaries }) }); },
  };
}

test('a late index response preserves the active comparison and does not touch its navigation', async () => {
  const shell = createShellWithPendingIndex('#/features/react/form-actions');
  const { fresh, calls, dialog } = shell;
  const input = { value: '' };
  let mounts = 0;
  let unmounts = 0;
  fresh.window.UI_LAB_ROUTES.pages['/features/react/form-actions'].mount = () => { mounts += 1; return () => { unmounts += 1; }; };
  shell.start();
  input.value = '사용자가 입력한 문구';
  await Promise.resolve();
  dialog.open = true;
  const navigationReads = calls.navigationReads;
  shell.finish();
  await fresh.window.UI_LAB_UPGRADE_LOGS.load();
  assert.equal(calls.renders, 1);
  assert.equal(mounts, 1);
  assert.equal(unmounts, 0);
  assert.equal(input.value, '사용자가 입력한 문구');
  assert.equal(calls.navigationReads, navigationReads, 'unrelated log updates must leave navigation DOM untouched');
  assert.equal(calls.closes, 0);
  assert.equal(dialog.open, true);
  assert.equal(calls.scrolls, 0);
});

test('a late log response updates its page without dismissing an open mobile menu', async () => {
  const shell = createShellWithPendingIndex('#/upgrades');
  shell.start();
  await Promise.resolve();
  shell.dialog.open = true;
  const renders = shell.calls.renders;
  shell.finish();
  await shell.fresh.window.UI_LAB_UPGRADE_LOGS.load();
  assert.equal(shell.fresh.window.UI_LAB_UPGRADE_LOGS.getState().status, 'ready');
  assert.equal(shell.calls.renders, renders + 1, 'the new log content must still render');
  assert.equal(shell.calls.closes, 0);
  assert.equal(shell.dialog.open, true);
  assert.equal(shell.calls.scrolls, 0);
});
