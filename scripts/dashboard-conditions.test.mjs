import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

const hook = registerHooks({ resolve(specifier, context, nextResolve) {
  if (["./_lib/types", "./source-catalog"].includes(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const {
  DEFAULT_DASHBOARD_CONDITIONS: defaults,
  parseDashboardConditions: parse,
  serializeDashboardConditions: serialize,
} = await import("../apps/lab-shell/app/ssr-lab/framework-dashboard/dashboard-conditions.ts");
hook.deregister();

test("생략한 조건은 현재 대시보드 기본값으로 복원한다", () => {
  assert.deepEqual(parse(new URLSearchParams()), {
    left: "next", right: "sveltekit", team: "alpha", delayMs: 400, scope: "entry",
  });
  assert.deepEqual(parse(new URLSearchParams("scope=view")), { ...defaults, scope: "view" });
  assert.deepEqual(parse(new URLSearchParams("scope=errors")), { ...defaults, scope: "errors" });
});

test("유효한 조건을 보존하고 무효 조건만 필드별 기본값으로 바꾼다", () => {
  assert.deepEqual(parse(new URLSearchParams("left=nuxt&right=unknown&team=empty&delay=800&scope=data")), {
    left: "nuxt", right: "sveltekit", team: "empty", delayMs: 800, scope: "data",
  });
  assert.deepEqual(parse(new URLSearchParams("left=unknown&right=react-router&team=unknown&delay=-1&scope=unknown")), {
    ...defaults, right: "react-router",
  });
  for (const delay of ["", "0400", "400.0", "4e2", " 400", "400ms", "1200"]) {
    assert.equal(parse(new URLSearchParams({ delay })).delayMs, 400);
  }
  assert.equal(parse(new URLSearchParams("delay=0")).delayMs, 0);
});

test("같은 값이 반복되어도 중복 필드만 기본값으로 복원한다", () => {
  const valid = { left: "nuxt", right: "react-router", team: "empty", delayMs: 800, scope: "view" };
  for (const [key, field] of [["left", "left"], ["right", "right"], ["team", "team"], ["delay", "delayMs"], ["scope", "scope"]]) {
    const params = new URLSearchParams(serialize(valid));
    params.append(key, params.get(key));
    assert.deepEqual(parse(params), { ...valid, [field]: defaults[field] });
  }
  assert.equal(parse(new URLSearchParams("team=missing&team=empty")).team, "alpha");
});

test("동일한 프레임워크 쌍은 오른쪽만 다른 기본 프레임워크로 바꾼다", () => {
  for (const left of ["next", "nuxt", "react-router", "sveltekit"]) {
    const result = parse(new URLSearchParams({ left, right: left }));
    assert.equal(result.left, left);
    assert.equal(result.right, left === "sveltekit" ? "next" : "sveltekit");
  }
  assert.equal(parse(new URLSearchParams("left=sveltekit&right=nuxt&right=next")).right, "next");
});

test("알 수 없는 키는 무시하며 원래 URL 조건과 기본값을 변경하지 않는다", () => {
  const params = new URLSearchParams("team=missing&url=https%3A%2F%2Fexample.com&scope=data&scope2=view&unknown=1&unknown=2");
  const before = params.toString();
  const result = parse(params);
  assert.deepEqual(result, { ...defaults, team: "missing", scope: "data" });
  assert.equal(params.toString(), before);
  result.left = "nuxt";
  assert.equal(defaults.left, "next");
  assert.equal(parse(new URLSearchParams()).left, "next");
});

test("공유 URL은 모든 키를 고정 순서로 기록하고 동일 쌍도 정규화한다", () => {
  assert.equal(serialize(defaults), "left=next&right=sveltekit&team=alpha&delay=400&scope=entry");
  assert.equal(serialize({ ...defaults, left: "sveltekit", right: "sveltekit", delayMs: 0 }),
    "left=sveltekit&right=next&team=alpha&delay=0&scope=entry");
});

test("오류 경계 범위와 404 조건을 새로고침 후 복원하며 중복 범위만 기본값으로 바꾼다", () => {
  const conditions = { left: "nuxt", right: "next", team: "missing", delayMs: 800, scope: "errors" };
  const query = serialize(conditions);
  assert.equal(query, "left=nuxt&right=next&team=missing&delay=800&scope=errors");
  assert.deepEqual(parse(new URLSearchParams(query)), conditions);
  assert.deepEqual(parse(new URLSearchParams(`${query}&scope=errors`)), { ...conditions, scope: "entry" });
  assert.deepEqual(parse(new URLSearchParams(query.replace("scope=errors", "scope=error"))), { ...conditions, scope: "entry" });
});

test("모든 576개 허용 조건 조합은 공유 후 복원해도 동일하며 재직렬화가 안정적이다", () => {
  let checked = 0;
  const frameworks = ["next", "nuxt", "react-router", "sveltekit"];
  for (const left of frameworks) for (const right of frameworks) {
    for (const team of ["alpha", "empty", "missing"]) for (const delayMs of [0, 400, 800]) {
      for (const scope of ["entry", "data", "view", "errors"]) {
        const conditions = { left, right, team, delayMs, scope };
        const query = serialize(conditions);
        const restored = parse(new URLSearchParams(query));
        assert.deepEqual(restored, {
          ...conditions,
          right: left === right ? (left === "sveltekit" ? "next" : "sveltekit") : right,
        });
        assert.equal(serialize(restored), query);
        assert.deepEqual([...new URLSearchParams(query).keys()], ["left", "right", "team", "delay", "scope"]);
        checked += 1;
      }
    }
  }
  assert.equal(checked, 576);
});
