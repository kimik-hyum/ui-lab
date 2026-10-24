import assert from "node:assert/strict";
import { test } from "node:test";

// 실행 중인 lab-shell의 실제 응답을 확인합니다. 서버·빌드는 시작하지 않습니다.
const origin = new URL(process.env.UI_LAB_BASE_URL ?? "http://127.0.0.1:3003");
assert.ok(["http:", "https:"].includes(origin.protocol));
assert.equal(origin.pathname, "/");
assert.equal(origin.search + origin.hash + origin.username + origin.password, "");

async function request(item) {
  const started = performance.now();
  const response = await fetch(new URL(`/api/cache-demo?item=${item}`, origin), {
    signal: AbortSignal.timeout(10_000),
  });
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  assert.match(response.headers.get("content-type") ?? "", /application\/json/);
  return { status: response.status, data: await response.json(), elapsed: performance.now() - started };
}

test("서로 다른 키는 각 프로젝트의 데이터를 반환한다", async () => {
  const [a, b] = await Promise.all([request("alpha"), request("beta")]);
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert.deepEqual([a.data.id, a.data.title, a.data.taskCount], ["alpha", "프로젝트 A", 12]);
  assert.deepEqual([b.data.id, b.data.title, b.data.taskCount], ["beta", "프로젝트 B", 8]);
  assert.ok(a.elapsed >= 650 && b.elapsed >= 650, "동일한 700ms 서버 지연을 적용해야 합니다.");
});

test("같은 URL을 다시 호출해도 서버 응답 캐시로 지연을 생략하지 않는다", async () => {
  const first = await request("alpha");
  const second = await request("alpha");
  assert.equal(second.status, 200);
  assert.deepEqual(second.data, first.data);
  assert.ok(second.elapsed >= 650, "캐시 효과는 TanStack Query의 메모리 캐시에서만 관찰합니다.");
});

test("오류 fixture는 503, 알 수 없는 키는 404로 구분한다", async () => {
  const [error, missing] = await Promise.all([request("error"), request("missing")]);
  assert.equal(error.status, 503);
  assert.equal(typeof error.data.error, "string");
  assert.ok(error.elapsed >= 650);
  assert.equal(missing.status, 404);
});
