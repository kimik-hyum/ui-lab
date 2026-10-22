import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createContext, runInContext } from 'node:vm';
import reportData from '../apps/lab-shell/public/previews/responsive-layout/report-data.js';

const base = new URL('../apps/lab-shell/public/previews/responsive-layout/', import.meta.url);
const source = readFileSync(new URL('report-pages.js', base), 'utf8');
const report = JSON.parse(readFileSync(new URL('reports/dashboard-ssr.json', base), 'utf8'));
const flush = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const response = (value = report) => ({ ok: true, json: async () => value });

class Element {
  hidden = false;
  textContent = '';
  children = [];
  attributes = new Map();
  listeners = new Map();
  classes = new Set();
  classList = { add: (name) => this.classes.add(name), remove: (name) => this.classes.delete(name) };
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  addEventListener(name, listener, options) {
    this.listeners.set(name, listener);
    options?.signal?.addEventListener('abort', () => this.removeEventListener(name, listener), { once: true });
  }
  removeEventListener(name, listener) { if (this.listeners.get(name) === listener) this.listeners.delete(name); }
  click() { return this.listeners.get('click')?.(); }
}

function setup() {
  const status = new Element(), content = new Element(), retry = new Element();
  const nodes = { '[data-report-status]': status, '[data-report-root]': content, '[data-report-retry]': retry };
  const requests = [], timers = new Map(), downloads = new Set();
  let now = 0, timerId = 0, urlId = 0, viewDisposals = 0;
  const context = createContext({
    AbortController, Blob,
    document: { createElement: () => new Element(), createDocumentFragment: () => new Element() },
    window: {
      UI_LAB_REPORT_DATA: reportData,
      UI_LAB_REPORT_DISTRIBUTION: { create: () => ({ element: new Element(), dispose: () => { viewDisposals += 1; } }) },
    },
    URL: {
      createObjectURL: () => { const url = `blob:report-${++urlId}`; downloads.add(url); return url; },
      revokeObjectURL: (url) => downloads.delete(url),
    },
    setTimeout: (callback, ms) => { timers.set(++timerId, { callback, at: now + ms }); return timerId; },
    clearTimeout: (id) => timers.delete(id),
    fetch: (url, options) => {
      const pending = deferred();
      requests.push({ ...pending, url, options });
      // 취소를 무시하는 늦은 응답도 현재 화면을 바꾸지 못하는지 검사합니다.
      return pending.promise;
    },
  });
  runInContext(source, context, { filename: 'report-pages.js' });
  const cleanup = context.window.UI_LAB_RECORDED_REPORTS['dashboard-ssr'].mount({ querySelector: (selector) => nodes[selector] });
  return {
    status, content, retry, requests, timers, downloads, cleanup,
    get viewDisposals() { return viewDisposals; },
    advance(ms) {
      now += ms;
      for (const [id, timer] of timers) if (timer.at <= now) { timers.delete(id); timer.callback(); }
    },
  };
}

function assertTimedOut(app) {
  assert.equal(app.requests.at(-1).options.signal.aborted, true);
  assert.equal(app.status.attributes.get('role'), 'alert');
  assert.match(app.status.textContent, /15초/);
  assert.equal(app.status.hidden, false);
  assert.equal(app.retry.hidden, false);
  assert.equal(app.content.attributes.get('aria-busy'), 'false');
  assert.equal(app.timers.size, 0);
}

test('응답이 없는 fetch를 15초에 취소하고 오류와 재시도를 표시한다', async () => {
  const app = setup();
  assert.equal(app.requests[0].url, './reports/dashboard-ssr.json');
  assert.equal(app.requests[0].options.cache, 'no-store');
  app.advance(14999);
  assert.equal(app.retry.hidden, true);
  assert.equal(app.requests[0].options.signal.aborted, false);
  app.advance(1);
  assertTimedOut(app);
  app.requests[0].resolve(response());
  await flush();
  assertTimedOut(app);
  assert.equal(app.downloads.size, 0);
  assert.equal(app.content.children.length, 0);
  app.cleanup();
});

test('응답 헤더를 받은 뒤 JSON 본문만 멈춰도 같은 15초 제한을 적용한다', async () => {
  const app = setup(), body = deferred();
  app.advance(10000);
  app.requests[0].resolve({ ok: true, json: () => body.promise });
  await flush();
  app.advance(4999);
  assert.equal(app.retry.hidden, true);
  app.advance(1);
  assertTimedOut(app);
  body.resolve(report);
  await flush();
  assert.equal(app.content.children.length, 0);
  assert.equal(app.downloads.size, 0);
  app.cleanup();
});

test('시간 초과 후 재시도가 성공하면 늦은 이전 JSON은 결과와 다운로드를 건드리지 않는다', async () => {
  const app = setup(), oldBody = deferred();
  app.requests[0].resolve({ ok: true, json: () => oldBody.promise });
  await flush();
  app.advance(15000);
  assertTimedOut(app);
  const retry = app.retry.click();
  assert.equal(app.retry.hidden, true);
  assert.equal(app.content.attributes.get('aria-busy'), 'true');
  app.requests[1].resolve(response());
  await retry;
  const rendered = app.content.children[0];
  assert.equal(app.status.hidden, true);
  assert.equal(app.content.hidden, false);
  assert.equal(app.content.attributes.get('aria-busy'), 'false');
  assert.equal(app.downloads.size, 1);
  assert.equal(app.timers.size, 0);
  oldBody.resolve({ invalid: true });
  await flush();
  assert.equal(app.content.children[0], rendered);
  assert.equal(app.status.hidden, true);
  assert.equal(app.downloads.size, 1);
  app.cleanup();
  assert.equal(app.downloads.size, 0);
  assert.equal(app.viewDisposals, 1);
});

test('새 요청은 이전 타이머를 즉시 해제하고 이전 오류가 새 로딩 상태를 바꾸지 못한다', async () => {
  const app = setup();
  app.advance(5000);
  const retry = app.retry.click();
  assert.equal(app.requests[0].options.signal.aborted, true);
  assert.equal(app.timers.size, 1);
  app.requests[0].reject(new Error('늦은 이전 요청 오류'));
  await flush();
  assert.equal(app.status.attributes.get('role'), 'status');
  assert.equal(app.content.attributes.get('aria-busy'), 'true');
  app.advance(10000);
  assert.equal(app.requests[1].options.signal.aborted, false);
  app.requests[1].resolve(response());
  await retry;
  assert.equal(app.timers.size, 0);
  app.cleanup();
});

for (const phase of ['fetch', 'json']) test(`${phase} 대기 중 메뉴를 떠나면 타이머와 요청을 정리하고 늦은 결과를 무시한다`, async () => {
  const app = setup(), body = deferred();
  if (phase === 'json') {
    app.requests[0].resolve({ ok: true, json: () => body.promise });
    await flush();
  }
  const status = app.status.textContent;
  app.cleanup();
  assert.equal(app.requests[0].options.signal.aborted, true);
  assert.equal(app.timers.size, 0);
  assert.equal(app.retry.listeners.size, 0);
  app.advance(15000);
  if (phase === 'json') body.resolve(report); else app.requests[0].resolve(response());
  await flush();
  assert.equal(app.status.textContent, status);
  assert.equal(app.status.attributes.get('role'), 'status');
  assert.equal(app.retry.hidden, true);
  assert.equal(app.content.children.length, 0);
  assert.equal(app.downloads.size, 0);
});

for (const [label, invalid] of [['HTTP', { ok: false }], ['데이터 형식', response({ invalid: true })]]) test(`${label} 오류도 수신과 타이머를 정리하고 재시도를 표시한다`, async () => {
  const app = setup();
  app.requests[0].resolve(invalid);
  await flush();
  assert.equal(app.requests[0].options.signal.aborted, true);
  assert.equal(app.timers.size, 0);
  assert.equal(app.status.attributes.get('role'), 'alert');
  assert.equal(app.retry.hidden, false);
  assert.equal(app.content.attributes.get('aria-busy'), 'false');
  app.cleanup();
});
