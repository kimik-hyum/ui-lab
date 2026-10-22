import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { setImmediate } from "node:timers/promises";
import { test } from "node:test";
import { Script } from "node:vm";

const script = new Script(readFileSync(new URL("../apps/lab-shell/public/previews/responsive-layout/condition-links.js", import.meta.url), "utf8"), {
  filename: "condition-links.js",
});
const hook = registerHooks({ resolve(specifier, context, nextResolve) {
  if (["./_lib/types", "./source-catalog"].includes(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const { parseDashboardConditions, serializeDashboardConditions } = await import("../apps/lab-shell/app/ssr-lab/framework-dashboard/dashboard-conditions.ts");
hook.deregister();

const route = "/features/frameworks/framework-dashboard";
const firstSearch = "left=next&right=sveltekit&team=alpha&delay=400&scope=entry";
const nextSearch = "left=nuxt&right=react-router&team=empty&delay=0&scope=view";
const message = (search) => ({ type: "ui-lab:dashboard-conditions", search });

// Use native event dispatch and AbortSignal cleanup; only the queried DOM fields
// and browser history/clipboard boundaries need substitutes.
function harness({ writeText = async () => {}, clipboard = true, source = "/preview-embed/ssr/framework-dashboard", controlsPresent = true } = {}) {
  let currentUrl = new URL(`https://ui-lab.example/previews/responsive-layout/index.html?v=conditions#${route}`);
  const initialUrl = currentUrl.href;
  const location = {
    get href() { return currentUrl.href; },
    get origin() { return currentUrl.origin; },
    get hash() { return currentUrl.hash; },
    set hash(_value) { assert.fail("주소 동기화는 hash 대입으로 iframe을 다시 마운트하면 안 됩니다."); },
  };
  const replacements = [];
  const history = {
    state: { shell: "preserved" },
    replaceState(state, title, url) {
      replacements.push({ state, title, url: String(url) });
      currentUrl = new URL(url, currentUrl);
    },
    pushState() { assert.fail("조건 변경은 뒤로가기 항목을 추가하면 안 됩니다."); },
  };
  const window = new EventTarget();
  const button = Object.assign(new EventTarget(), { disabled: true });
  const status = { textContent: "" };
  const address = {
    value: "", focusCount: 0, selectCount: 0,
    focus() { this.focusCount += 1; },
    select() { this.selectCount += 1; },
  };
  const fallback = { hidden: true, querySelector: (selector) => selector === "textarea" ? address : null };
  const controls = { querySelector: (selector) => ({ button, '[role="status"]': status, "[data-condition-fallback]": fallback })[selector] ?? null };
  const root = { querySelector: (selector) => controlsPresent && selector === "[data-condition-links]" ? controls : null };
  const frame = {
    dataset: { source }, contentWindow: {},
    set src(_value) { assert.fail("메시지를 받은 부모는 iframe src를 다시 설정하면 안 됩니다."); },
  };
  const writes = [];
  const navigator = clipboard ? { clipboard: { writeText(value) { writes.push(value); return writeText(value); } } } : {};
  script.runInNewContext({ window, location, history, navigator, URL, URLSearchParams, AbortController });
  const api = window.UI_LAB_CONDITION_LINKS;
  const cleanup = api.mount(root, frame);
  return {
    api, location, initialUrl, history, replacements, button, status, fallback, address, writes, cleanup,
    send(data, overrides = {}) {
      const event = new Event("message");
      Object.assign(event, { origin: location.origin, source: frame.contentWindow, data, ...overrides });
      window.dispatchEvent(event);
    },
    click() { button.dispatchEvent(new Event("click")); },
    navigate(hash) { currentUrl.hash = hash; },
  };
}

test("현재 iframe의 유효한 조건만 주소를 정규화하고 같은 조건은 다시 기록하지 않는다", async () => {
  const view = harness();
  try {
    view.click();
    await setImmediate();
    assert.equal(view.writes.length, 0, "초기 조건을 받기 전에는 복사하지 않습니다.");
    view.send(message("scope=view&delay=0&team=empty&right=react-router&left=nuxt"));
    assert.equal(view.location.href, `${view.initialUrl}?${nextSearch}`);
    assert.equal(view.button.disabled, false);
    assert.equal(view.replacements.length, 1);
    assert.equal(view.replacements[0].state, view.history.state);
    view.send(message(nextSearch));
    assert.equal(view.replacements.length, 1);
    view.click();
    await setImmediate();
    assert.deepEqual(view.writes, [view.location.href]);
    assert.match(view.status.textContent, /복사했습니다/);
    view.send(message(firstSearch));
    assert.equal(view.status.textContent, "", "조건이 달라지면 이전 복사 성공 안내를 지웁니다.");
  } finally { view.cleanup(); }
});

test("오류 경계 범위는 iframe 재마운트 없이 공유 주소에 반영되고 새로고침 조건으로 복원된다", async () => {
  const view = harness();
  try {
    const conditions = { left: "nuxt", right: "next", team: "missing", delayMs: 800, scope: "errors" };
    view.send(message(serializeDashboardConditions({ ...conditions, scope: "entry" })));
    const before = view.replacements.length;
    const errorsSearch = serializeDashboardConditions(conditions);
    assert.match(errorsSearch, /scope=errors$/);
    view.send(message(errorsSearch));
    assert.equal(view.replacements.length, before + 1);
    assert.equal(view.location.hash, `#${route}?${errorsSearch}`);
    view.click();
    await setImmediate();
    const copied = new URL(view.writes[0]);
    const restoredSearch = copied.hash.slice(copied.hash.indexOf('?') + 1);
    assert.deepEqual(parseDashboardConditions(new URLSearchParams(restoredSearch)), conditions);
    assert.equal(view.replacements.at(-1).state, view.history.state);
    assert.match(view.status.textContent, /복사했습니다/);
  } finally { view.cleanup(); }
});

test("다른 origin·iframe과 현재 메뉴를 떠난 뒤 도착한 메시지는 무시한다", () => {
  const view = harness();
  try {
    view.send(message(firstSearch), { origin: "https://other.example" });
    view.send(message(firstSearch), { source: {} });
    view.navigate("/features/frameworks");
    const menuUrl = view.location.href;
    view.send(message(firstSearch));
    assert.equal(view.location.href, menuUrl, "이전 iframe 메시지가 새 메뉴 주소를 되돌리면 안 됩니다.");
    assert.equal(view.replacements.length, 0);
    assert.equal(view.button.disabled, true);
  } finally { view.cleanup(); }
});

test("누락·중복·무효값·동일 쌍과 예상하지 못한 메시지는 주소나 준비 상태를 바꾸지 않는다", () => {
  const view = harness();
  try {
    const invalid = [
      null, "unexpected", {}, { type: "other", search: firstSearch },
      message(null), message({ query: firstSearch }), message("x".repeat(257)),
      message(firstSearch.replace("&scope=entry", "")),
      message(`${firstSearch}&scope=entry`),
      message(`${firstSearch}&unknown=value`),
      message(firstSearch.replace("scope=entry", "unknown=entry")),
      message(firstSearch.replace("right=sveltekit", "right=next")),
      message(firstSearch.replace("left=next", "left=unknown")),
      message(firstSearch.replace("team=alpha", "team=unknown")),
      message(firstSearch.replace("delay=400", "delay=0400")),
      message(firstSearch.replace("scope=entry", "scope=unknown")),
    ];
    for (const data of invalid) view.send(data);
    assert.equal(view.location.href, view.initialUrl);
    assert.equal(view.replacements.length, 0);
    assert.equal(view.button.disabled, true);
    assert.equal(view.status.textContent, "");
    assert.equal(view.fallback.hidden, true);
  } finally { view.cleanup(); }
});

test("조건 공유가 없는 페이지와 다른 embed에는 메시지 연결을 만들지 않는다", () => {
  for (const options of [{ controlsPresent: false }, { source: "/preview-embed/features/libraries/cache" }]) {
    const view = harness(options);
    try {
      view.send(message(firstSearch));
      view.click();
      assert.equal(view.replacements.length, 0);
      assert.equal(view.writes.length, 0);
      assert.equal(view.button.disabled, true);
    } finally { view.cleanup(); }
  }
});

test("클립보드 실패 시 현재 주소를 선택 가능한 대체 입력에 표시한다", async () => {
  const view = harness({ writeText: async () => { throw new Error("clipboard denied"); } });
  try {
    view.send(message(firstSearch));
    view.click();
    await setImmediate();
    assert.equal(view.fallback.hidden, false);
    assert.equal(view.address.value, view.location.href);
    assert.equal(view.address.focusCount, 1);
    assert.equal(view.address.selectCount, 1);
    assert.match(view.status.textContent, /직접 복사/);
    view.send(message(nextSearch));
    assert.equal(view.fallback.hidden, true);
    assert.equal(view.status.textContent, "");
    view.click();
    await setImmediate();
    assert.equal(view.address.value, view.location.href);
    assert.match(view.address.value, /scope=view$/);
    assert.equal(view.button.disabled, false);
  } finally { view.cleanup(); }
});

test("클립보드 API가 없는 환경에서도 주소를 직접 복사할 수 있다", async () => {
  const view = harness({ clipboard: false });
  try {
    view.send(message(firstSearch));
    view.click();
    await setImmediate();
    assert.equal(view.fallback.hidden, false);
    assert.equal(view.address.value, view.location.href);
    assert.equal(view.address.selectCount, 1);
    assert.equal(view.button.disabled, false);
  } finally { view.cleanup(); }
});

test("복사 중 조건이 달라지면 이전 성공·실패 응답을 표시하지 않고 새 조건으로 다시 복사한다", async () => {
  for (const outcome of ["resolve", "reject"]) {
    const pending = Promise.withResolvers();
    let calls = 0;
    const view = harness({ writeText: () => ++calls === 1 ? pending.promise : Promise.resolve() });
    try {
      view.send(message(firstSearch));
      view.click();
      view.click();
      assert.equal(view.writes.length, 1, "진행 중인 복사를 중복 실행하지 않습니다.");
      view.send(message(nextSearch));
      assert.equal(view.button.disabled, true);
      pending[outcome](outcome === "reject" ? new Error("late clipboard denial") : undefined);
      await setImmediate();
      assert.equal(view.status.textContent, "");
      assert.equal(view.fallback.hidden, true);
      assert.equal(view.address.focusCount, 0);
      assert.equal(view.button.disabled, false);
      view.click();
      await setImmediate();
      assert.equal(view.writes[1], view.location.href);
      assert.match(view.status.textContent, /복사했습니다/);
    } finally { view.cleanup(); }
  }
});

test("정리 후 메시지·클릭과 진행 중이던 복사 응답은 더 이상 화면을 갱신하지 않는다", async () => {
  const pending = Promise.withResolvers();
  const view = harness({ writeText: () => pending.promise });
  view.send(message(firstSearch));
  view.click();
  const readyUrl = view.location.href;
  view.cleanup();
  view.send(message(nextSearch));
  view.click();
  pending.resolve();
  await setImmediate();
  assert.equal(view.location.href, readyUrl);
  assert.equal(view.replacements.length, 1);
  assert.equal(view.writes.length, 1);
  assert.equal(view.status.textContent, "");
  assert.equal(view.fallback.hidden, true);
});

test("부모가 다른 메뉴로 이동하면 진행 중 복사의 완료 안내도 무시한다", async () => {
  const pending = Promise.withResolvers();
  const view = harness({ writeText: () => pending.promise });
  try {
    view.send(message(firstSearch));
    view.click();
    view.navigate("/reports");
    pending.resolve();
    await setImmediate();
    assert.equal(view.status.textContent, "");
    assert.equal(view.fallback.hidden, true);
    assert.equal(view.location.hash, "#/reports");
  } finally { view.cleanup(); }
});

test("TypeScript 조건 직렬화의 모든 576조합을 실제 부모 연결이 동일하게 수용한다", () => {
  const view = harness();
  try {
    let checked = 0;
    const frameworks = ["next", "react-router", "sveltekit", "nuxt"];
    for (const left of frameworks) for (const right of frameworks) {
      for (const team of ["alpha", "empty", "missing"]) for (const delayMs of [0, 400, 800]) {
        for (const scope of ["entry", "data", "view", "errors"]) {
          const search = serializeDashboardConditions({ left, right, team, delayMs, scope });
          assert.equal(view.api.canonicalSearch(search), search);
          view.send(message(search));
          assert.equal(view.location.hash, `#${route}?${search}`);
          assert.equal(view.button.disabled, false);
          checked += 1;
        }
      }
    }
    assert.equal(checked, 576);
  } finally { view.cleanup(); }
});
