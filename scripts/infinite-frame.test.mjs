import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Script, createContext } from 'node:vm';

const directory = new URL('../apps/lab-shell/public/previews/responsive-layout/', import.meta.url);
const script = new Script(readFileSync(new URL('infinite-scroll-pages.js', directory), 'utf8'));

// Exercise the real mount; substitute only document arrival, events and time.
function harness({ slug = '', search = 'page=5&filter=all' } = {}) {
  const route = `/lab/infinite-scroll${slug}`;
  const source = `/preview-embed/infinite-scroll${slug}`;
  const view = slug.slice(1) || 'demo';
  let currentUrl = new URL(`https://ui-lab.example/previews/responsive-layout/index.html#${route}${search ? `?${search}` : ''}`);
  const location = {
    get href() { return currentUrl.href; },
    get hash() { return currentUrl.hash; },
    get origin() { return currentUrl.origin; },
  };
  const history = {
    replaceState(_state, _title, url) { currentUrl = new URL(url, currentUrl); },
    pushState() { assert.fail('페이지 추적은 방문 기록을 추가하지 않습니다.'); },
  };
  const window = new EventTarget();
  const document = { activeElement: null };
  const timers = new Map();
  const observers = [];
  let timerId = 0;
  const element = () => Object.assign(new EventTarget(), {
    hidden: false, textContent: '', attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { document.activeElement = this; },
  });
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
      this.contentDocument = { URL: 'about:blank' }; this.parent = null;
    }
    cloneNode() { return new Frame(); }
    removeAttribute(name) { if (name === 'src') this.src = ''; }
    focus(options) { document.activeElement = this; this.focusOptions = options; }
    remove() {
      if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
      this.parent = null;
    }
  }
  const initial = new Frame();
  wrap.replaceChildren(initial);
  const status = element(), loadState = element(), retry = element();
  retry.hidden = true;
  const nodes = {
    '[data-infinite-frame]': initial, '.infinite-frame-wrap': wrap,
    '[data-infinite-status]': status, '[data-infinite-load-state]': loadState, '[data-infinite-retry]': retry,
  };
  script.runInContext(createContext({
    window, document, location, history, URL, URLSearchParams, AbortController,
    MutationObserver: class {
      constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
      observe(target) { this.target = target; }
      disconnect() { this.disconnected = true; }
    },
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  }));
  const page = window.UI_LAB_INFINITE[`infinite-scroll${slug}`];
  const cleanup = page.mount({ querySelector: (selector) => nodes[selector] ?? null }, { search });
  return {
    page, location, document, wrap, status, loadState, retry, timers, observers, cleanup,
    get frame() { return wrap.children[0]; },
    navigate(path) { currentUrl.hash = path; },
    clickRetry() { retry.dispatchEvent(new Event('click')); },
    expire() {
      assert.equal(timers.size, 1);
      const [id, timer] = timers.entries().next().value;
      assert.equal(timer.delay, 15000);
      timers.delete(id); timer.callback();
    },
    send(frame, nextSearch, { origin = location.origin, pathname = source } = {}) {
      const event = new Event('message');
      Object.assign(event, {
        origin, source: frame.contentWindow,
        data: { type: 'ui-lab:infinite-location', pathname, search: nextSearch },
      });
      window.dispatchEvent(event);
    },
    arrive(frame, { url = frame.src, marker = true, markerView = view, markerPath = source, heading = true, links = [] } = {}) {
      const headingSelector = view === 'demo' || view === 'adapter-live' ? 'main [data-infinite-heading] h1' : 'header h1';
      const screen = {
        dataset: { infiniteView: markerView, infinitePath: markerPath },
        querySelector: (selector) => heading && selector === headingSelector ? {} : null,
      };
      const doc = {
        URL: url, body: {},
        querySelector: (selector) => marker && selector === '[data-infinite-root="v1"]' ? screen : null,
        querySelectorAll: (selector) => selector === 'a[href]' ? links : [],
      };
      frame.contentDocument = doc; frame.dispatchEvent(new Event('load'));
      return doc;
    },
  };
}

test('네 보기 모두 빈 문서 load는 기다리고 해당 서버 화면을 확인한 뒤에만 로딩을 끝낸다', () => {
  for (const slug of ['', '/adapter-live', '/adapter-view', '/hook']) {
    const view = harness({ slug, search: slug === '/adapter-live' ? 'p=7' : 'page=5' });
    try {
      const frame = view.frame;
      assert.equal(new URL(frame.src).search, slug === '/adapter-live' ? '?p=7' : '?page=5');
      frame.dispatchEvent(new Event('load'));
      assert.equal(view.timers.size, 1);
      assert.equal(view.loadState.hidden, false);
      view.arrive(frame);
      assert.equal(view.timers.size, 0);
      assert.equal(view.loadState.hidden, true);
      assert.equal(view.wrap.hidden, false);
      assert.equal(view.observers.length, 1);
    } finally { view.cleanup(); }
  }
});

test('15초 뒤 멈춘 프레임을 제거하고 재시도는 새 문서 하나만 시작한다', () => {
  const view = harness();
  try {
    const old = view.frame;
    view.expire();
    assert.equal(view.frame, undefined);
    assert.equal(view.wrap.hidden, true);
    assert.equal(view.retry.hidden, false);
    assert.equal(view.status.attributes.role, 'alert');
    assert.match(view.status.textContent, /실험 화면.*15초.*다시/);
    view.clickRetry();
    const fresh = view.frame;
    assert.notEqual(fresh.contentWindow, old.contentWindow);
    assert.equal(view.retry.hidden, false);
    assert.equal(view.retry.attributes['aria-disabled'], 'true');
    assert.equal(view.status.attributes.role, 'status');
    view.clickRetry();
    assert.equal(view.frame, fresh, '대기 중 재시도 이벤트는 중복 문서를 만들지 않습니다.');
    view.arrive(fresh);
    assert.equal(view.loadState.hidden, true);
    assert.match(view.page.body, /data-infinite-retry hidden>화면을 다시 불러오기/);
    assert.match(readFileSync(new URL('style.css', directory), 'utf8'), /\.infinite-load-state \.infinite-retry\s*\{\s*min-height:44px;/);
  } finally { view.cleanup(); }
});

test('키보드 재시도는 대기 중 초점을 유지하고 여전히 버튼에 있을 때만 새 frame으로 옮긴다', () => {
  for (const moveElsewhere of [false, true]) {
    const view = harness();
    try {
      assert.equal(view.retry.hidden, true, '최초 로딩에서는 재시도 버튼을 노출하지 않습니다.');
      view.expire();
      assert.equal(view.retry.attributes['aria-disabled'], 'false');
      view.retry.focus();
      view.clickRetry();
      assert.equal(view.document.activeElement, view.retry);
      assert.equal(view.retry.hidden, false);
      const elsewhere = {};
      if (moveElsewhere) view.document.activeElement = elsewhere;
      const frame = view.frame;
      view.arrive(frame);
      assert.equal(view.loadState.hidden, true);
      assert.equal(view.document.activeElement, moveElsewhere ? elsewhere : frame);
      assert.equal(frame.focusOptions?.preventScroll, moveElsewhere ? undefined : true);
    } finally { view.cleanup(); }
  }
});

test('외부·다른 경로·오류 문서·다른 보기·본문 없는 wrapper를 정상 화면으로 오인하지 않는다', () => {
  for (const options of [
    { marker: false }, { heading: false }, { markerView: 'hook' }, { markerPath: '/wrong' },
    { url: 'https://ui-lab.example/not-found' },
    { url: 'https://other.example/preview-embed/infinite-scroll' },
  ]) {
    const view = harness();
    try {
      view.arrive(view.frame, options);
      assert.equal(view.frame, undefined);
      assert.equal(view.retry.hidden, false);
      assert.equal(view.loadState.hidden, false);
      assert.equal(view.status.attributes.role, 'alert');
      assert.equal(view.timers.size, 0);
      assert.equal(view.observers.length, 0);
    } finally { view.cleanup(); }
  }
});

test('재시도는 현재 p/page 조건을 읽고 이전 프레임의 load·message·observer는 무시한다', () => {
  for (const [slug, search] of [['', 'page=13&filter=all'], ['/adapter-live', 'p=13&filter=all']]) {
    const view = harness({ slug });
    try {
      const old = view.frame;
      view.arrive(old);
      view.send(old, search);
      assert.equal(view.location.hash, `#/lab/infinite-scroll${slug}?${search}`);
      old.dispatchEvent(new Event('error'));
      assert.equal(view.observers[0].disconnected, true);
      view.clickRetry();
      const fresh = view.frame;
      assert.equal(new URL(fresh.src).search.slice(1), search);
      const pending = view.status.textContent;
      view.arrive(old);
      view.send(old, 'page=1');
      view.observers[0].callback();
      assert.equal(view.location.hash, `#/lab/infinite-scroll${slug}?${search}`);
      assert.equal(view.status.textContent, pending);
      assert.equal(view.loadState.hidden, false);
      assert.equal(view.observers.length, 1);
      view.arrive(fresh);
      view.send(fresh, search, { origin: 'https://other.example' });
      view.send(fresh, 'page=99', { pathname: '/wrong' });
      assert.equal(view.location.hash, `#/lab/infinite-scroll${slug}?${search}`);
      view.send(fresh, 'page=14');
      assert.equal(view.location.hash, `#/lab/infinite-scroll${slug}?page=14`);
    } finally { view.cleanup(); }
  }
});

test('주소에서 검색조건을 지운 뒤 재시도해도 최초 mount 조건이 되살아나지 않는다', () => {
  const view = harness();
  try {
    const old = view.frame;
    view.arrive(old);
    view.send(old, '');
    old.dispatchEvent(new Event('error'));
    view.clickRetry();
    assert.equal(new URL(view.frame.src).search, '');
  } finally { view.cleanup(); }
});

test('내부 링크는 키보드·새 탭 경로도 보존하고 외부 링크는 변경하지 않는다', () => {
  const view = harness({ slug: '/hook' });
  const links = [
    { href: 'https://ui-lab.example/void-ui/pagination-infinite-scroll?page=3' },
    { href: 'https://ui-lab.example/preview-embed/infinite-scroll/adapter-live?p=7' },
    { href: 'https://ui-lab.example/void-ui/pagination-infinite-scroll/adapter-view' },
    { href: 'https://ui-lab.example/void-ui/pagination-infinite-scroll/hook' },
    { href: 'https://other.example/help' },
  ];
  try {
    view.arrive(view.frame, { links });
    assert.deepEqual(links.slice(0, 4).map((link) => new URL(link.href).hash), [
      '#/lab/infinite-scroll?page=3', '#/lab/infinite-scroll/adapter-live?p=7',
      '#/lab/infinite-scroll/adapter-view', '#/lab/infinite-scroll/hook',
    ]);
    assert.ok(links.slice(0, 4).every((link) => link.target === '_top'));
    assert.equal(links[4].href, 'https://other.example/help');
    assert.equal(links[4].target, undefined);
    links.push({ href: 'https://ui-lab.example/void-ui/pagination-infinite-scroll?page=9' });
    view.observers[0].callback();
    assert.equal(new URL(links[5].href).hash, '#/lab/infinite-scroll?page=9');
  } finally { view.cleanup(); }
  assert.equal(view.observers[0].disconnected, true);
});

test('다른 메뉴로 이동하거나 cleanup한 뒤에는 옛 문서·메시지·재시도가 상태를 바꾸지 않는다', () => {
  const view = harness();
  const old = view.frame;
  const pending = view.status.textContent;
  view.navigate('/features/react');
  view.arrive(old);
  view.send(old, 'page=9');
  assert.equal(view.status.textContent, pending);
  assert.equal(view.location.hash, '#/features/react');
  assert.equal(view.observers.length, 0);
  view.cleanup();
  assert.equal(view.timers.size, 0);
  assert.equal(view.frame, undefined);
  view.clickRetry();
  view.arrive(old);
  view.send(old, 'page=10');
  assert.equal(view.frame, undefined);
  assert.equal(view.location.hash, '#/features/react');
  assert.equal(view.observers.length, 0);
});
