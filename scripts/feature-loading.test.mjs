import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Script, createContext } from 'node:vm';

const directory = new URL('../apps/lab-shell/public/previews/responsive-layout/', import.meta.url);
const scripts = ['condition-links.js', 'feature-pages.js'].map((name) => new Script(readFileSync(new URL(name, directory), 'utf8'), { filename: name }));
const route = '/features/frameworks/framework-dashboard';
const source = '/preview-embed/ssr/framework-dashboard';
const initialSearch = 'left=next&right=sveltekit&team=alpha&delay=400&scope=entry';
const changedSearch = 'left=nuxt&right=react-router&team=empty&delay=0&scope=errors';

// Exercise the public mount and its real condition-message bridge. Only browser
// boundaries (document arrival, observers, history and the clock) are replaced.
function harness({ shareConditions = true, hashSearch = initialSearch } = {}) {
  let currentUrl = new URL(`https://ui-lab.example/previews/responsive-layout/index.html#${route}${hashSearch ? `?${hashSearch}` : ''}`);
  const location = {
    get href() { return currentUrl.href; },
    get hash() { return currentUrl.hash; },
    get origin() { return currentUrl.origin; },
  };
  const history = {
    state: { shell: true },
    replaceState(_state, _title, url) { currentUrl = new URL(url, currentUrl); },
    pushState() { assert.fail('조건 변경은 새 방문 기록을 추가하지 않습니다.'); },
  };
  const window = new EventTarget();
  window.UI_LAB_COMPARISONS = [{ slug: 'frameworks/framework-dashboard', family: 'frameworks', source, title: '프레임워크 비교', shareConditions }];
  let timerId = 0;
  const timers = new Map();
  const resizeObservers = [];
  const mutationObservers = [];
  const observerClass = (list) => class {
    constructor(callback) { this.callback = callback; this.disconnected = false; list.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  };
  const element = (extra = {}) => Object.assign(new EventTarget(), {
    hidden: false, textContent: '', attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
  }, extra);
  const wrap = {
    hidden: false, children: [],
    replaceChildren(frame) {
      this.children.forEach((child) => { child.parent = null; });
      this.children = [frame]; frame.parent = this;
    },
  };
  class Frame extends EventTarget {
    constructor() {
      super(); this.dataset = { source }; this.src = ''; this.contentWindow = {};
      this.style = { height: '', removeProperty(name) { this[name] = ''; } };
      this.contentDocument = { URL: 'about:blank' }; this.parent = null;
    }
    cloneNode() {
      const copy = new Frame(); copy.dataset = { ...this.dataset }; copy.style.height = this.style.height;
      return copy;
    }
    removeAttribute(name) {
      if (name === 'src') this.src = '';
      if (name === 'data-content-sized') delete this.dataset.contentSized;
    }
    remove() {
      if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
      this.parent = null;
    }
  }
  // Simulate stale sizing as well: retry must not copy a preceding document's
  // inline height, even if the mount's original template already has one.
  const initialFrame = new Frame();
  initialFrame.style.height = '1900px'; initialFrame.dataset.contentSized = 'true';
  wrap.replaceChildren(initialFrame);
  const status = element();
  const retry = element({ hidden: true });
  const loadState = element();
  const button = element({ disabled: true });
  const conditionStatus = element();
  const address = { value: '', focus() {}, select() {} };
  const fallback = { hidden: true, querySelector: () => address };
  const controls = { querySelector: (selector) => ({ button, '[role="status"]': conditionStatus, '[data-condition-fallback]': fallback })[selector] ?? null };
  const nodes = {
    '[data-feature-frame]': initialFrame, '.infinite-frame-wrap': wrap,
    '[data-feature-loading]': status, '[data-feature-retry]': retry,
    '[data-feature-load-state]': loadState,
    '[data-condition-links]': shareConditions ? controls : null,
  };
  const root = { querySelector: (selector) => nodes[selector] ?? null };
  const context = createContext({
    window, location, history, navigator: { clipboard: { writeText: async () => {} } },
    URL, URLSearchParams, AbortController,
    ResizeObserver: observerClass(resizeObservers), MutationObserver: observerClass(mutationObservers),
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  scripts.forEach((script) => script.runInContext(context));
  const page = window.UI_LAB_FEATURES['frameworks/framework-dashboard'];
  const cleanup = page.mount(root, { search: initialSearch });
  return {
    page, location, wrap, status, retry, loadState, button, conditionStatus, fallback,
    timers, resizeObservers, mutationObservers, cleanup,
    get frame() { return wrap.children[0]; },
    clickRetry() { retry.dispatchEvent(new Event('click')); },
    expire() {
      assert.equal(timers.size, 1);
      const [id, timer] = timers.entries().next().value;
      assert.equal(timer.delay, 15000);
      timers.delete(id); timer.callback();
    },
    navigate(path) { currentUrl.hash = path; },
    send(frame, search) {
      const event = new Event('message');
      Object.assign(event, { origin: location.origin, source: frame.contentWindow, data: { type: 'ui-lab:dashboard-conditions', search } });
      window.dispatchEvent(event);
    },
    arrive(frame, { url = frame.src, root = true, heading = true, height = 640 } = {}) {
      const comparison = {
        querySelector: (selector) => heading && selector === 'header h1' ? {} : null,
        getBoundingClientRect: () => ({ height }),
      };
      const doc = {
        URL: url, documentElement: { dataset: {} },
        querySelector: (selector) => root && selector === '[data-comparison-root]' ? comparison : null,
        body: { nodeType: 1, matches: () => false, querySelectorAll: () => [] },
      };
      frame.contentDocument = doc; frame.dispatchEvent(new Event('load'));
      return doc;
    },
  };
}

test('빈 문서의 load는 기다리고 실제 비교 문서가 도착하면 높이를 맞추고 제한 시간을 해제한다', () => {
  const view = harness();
  try {
    const frame = view.frame;
    assert.equal(new URL(frame.src).search.slice(1), initialSearch);
    assert.equal(frame.style.height, '');
    assert.equal(frame.dataset.contentSized, undefined);
    frame.dispatchEvent(new Event('load'));
    assert.equal(view.timers.size, 1);
    assert.equal(view.loadState.hidden, false);
    const doc = view.arrive(frame, { height: 640.2 });
    assert.equal(view.timers.size, 0);
    assert.equal(view.loadState.hidden, true);
    assert.equal(view.wrap.hidden, false);
    assert.equal(doc.documentElement.dataset.comparisonEmbedded, 'true');
    assert.equal(frame.style.height, '641px');
    assert.equal(frame.dataset.contentSized, 'true');
    assert.equal(view.resizeObservers.length, 1);
    assert.equal(view.mutationObservers.length, 1);
  } finally { view.cleanup(); }
});

test('최초 문서가 지연되면 15초 안내와 재시도를 제공하고 새 프레임에서 정상 복구한다', () => {
  const view = harness();
  try {
    const old = view.frame;
    view.expire();
    assert.equal(view.frame, undefined);
    assert.equal(view.wrap.hidden, true);
    assert.equal(view.loadState.hidden, false);
    assert.equal(view.status.attributes.role, 'alert');
    assert.match(view.status.textContent, /15초.*다시/);
    assert.equal(view.retry.hidden, false);
    view.clickRetry();
    const fresh = view.frame;
    assert.notEqual(fresh, old);
    assert.notEqual(fresh.contentWindow, old.contentWindow);
    assert.equal(fresh.style.height, '');
    assert.equal(fresh.dataset.contentSized, undefined);
    assert.equal(view.retry.hidden, true);
    assert.equal(view.status.attributes.role, 'status');
    view.clickRetry();
    assert.equal(view.frame, fresh, '로딩 중 중복 클릭은 요청을 늘리지 않습니다.');
    view.arrive(fresh);
    assert.equal(view.loadState.hidden, true);
    assert.equal(view.timers.size, 0);
    assert.match(view.page.body, /type="button" class="button feature-retry"/);
    assert.match(readFileSync(new URL('feature-styles.css', directory), 'utf8'), /\.feature-load-state \.feature-retry\s*\{\s*min-height:44px;/);
  } finally { view.cleanup(); }
});

test('에러 레이아웃·잘못된 경로·외부 문서는 성공 화면으로 오인하지 않는다', () => {
  for (const options of [
    { root: false }, { heading: false },
    { url: 'https://ui-lab.example/not-found' },
    { url: `https://unrelated.example${source}` },
  ]) {
    const view = harness();
    try {
      view.arrive(view.frame, options);
      assert.equal(view.frame, undefined);
      assert.equal(view.retry.hidden, false);
      assert.equal(view.status.attributes.role, 'alert');
      assert.equal(view.timers.size, 0);
      assert.equal(view.resizeObservers.length, 0);
    } finally { view.cleanup(); }
  }
});

test('재시도는 마지막 공유 조건을 보존하고 이전 문서·메시지가 새 화면을 변경하지 못한다', () => {
  const view = harness();
  try {
    const old = view.frame;
    view.arrive(old, { height: 1800 });
    view.send(old, changedSearch);
    assert.equal(view.location.hash, `#${route}?${changedSearch}`);
    assert.equal(view.button.disabled, false);
    old.dispatchEvent(new Event('error'));
    assert.equal(view.button.disabled, true);
    assert.equal(view.resizeObservers[0].disconnected, true);
    assert.equal(view.mutationObservers[0].disconnected, true);
    view.clickRetry();
    const fresh = view.frame;
    assert.equal(new URL(fresh.src).search.slice(1), changedSearch);
    assert.equal(fresh.style.height, '');
    assert.equal(fresh.dataset.contentSized, undefined);
    const pending = view.status.textContent;
    view.send(old, initialSearch);
    view.arrive(old, { height: 9999 });
    view.resizeObservers[0].callback();
    assert.equal(view.location.hash, `#${route}?${changedSearch}`);
    assert.equal(view.status.textContent, pending);
    assert.equal(view.loadState.hidden, false);
    assert.equal(view.button.disabled, true);
    assert.equal(fresh.style.height, '');
    view.arrive(fresh, { height: 500 });
    view.send(fresh, changedSearch);
    assert.equal(fresh.style.height, '500px');
    assert.equal(view.button.disabled, false);
  } finally { view.cleanup(); }
});

test('다른 메뉴로 이동한 뒤 이전 문서가 도착해도 상태를 갱신하지 않고 cleanup이 구독을 해제한다', () => {
  const view = harness();
  const old = view.frame;
  view.navigate('/features/react');
  const loading = view.status.textContent;
  view.arrive(old);
  view.send(old, changedSearch);
  assert.equal(view.status.textContent, loading);
  assert.equal(view.loadState.hidden, false);
  assert.equal(view.resizeObservers.length, 0);
  assert.equal(view.location.hash, '#/features/react');
  view.cleanup();
  assert.equal(view.timers.size, 0);
  assert.equal(view.frame, undefined);
  view.clickRetry();
  view.arrive(old);
  view.send(old, initialSearch);
  assert.equal(view.frame, undefined);
  assert.equal(view.resizeObservers.length, 0);
  assert.equal(view.location.hash, '#/features/react');
});

test('조건 공유가 없는 비교도 load 오류에서 재시도하고 종료 시 모든 관찰자를 해제한다', () => {
  const view = harness({ shareConditions: false });
  const old = view.frame;
  assert.equal(new URL(old.src).search, '');
  old.dispatchEvent(new Event('error'));
  assert.equal(view.retry.hidden, false);
  view.clickRetry();
  const fresh = view.frame;
  view.arrive(fresh);
  view.cleanup();
  assert.equal(view.timers.size, 0);
  assert.equal(view.resizeObservers[0].disconnected, true);
  assert.equal(view.mutationObservers[0].disconnected, true);
  view.resizeObservers[0].callback();
  view.clickRetry();
  assert.equal(view.frame, undefined);
});
