import assert from "node:assert/strict";
import http from "node:http";
import { gzipSync } from "node:zlib";
import test from "node:test";
import { createThrottledProxy, lighthouseNetworkArgs, readNetworkProfile } from "./performance-network.mjs";

async function fixture(t, handler) {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  return `http://127.0.0.1:${server.address().port}`;
}

test("명시적인 프로필만 허용하고 Lighthouse의 실제 제한 인자를 만든다", () => {
  assert.equal(readNetworkProfile(""), null);
  assert.throws(() => readNetworkProfile("typo"), /Unknown/);
  const args = lighthouseNetworkArgs(readNetworkProfile("1mbps-100ms"));
  assert.ok(args.includes("--throttling-method=devtools"));
  assert.ok(args.includes("--throttling.downloadThroughputKbps=1000"));
  assert.ok(args.includes("--throttling.requestLatencyMs=100"));
});

test("응답 본문에 속도 제한과 지연을 적용하고 원본·상태를 보존한다", async (t) => {
  const payload = Buffer.alloc(32_000, "a");
  const origin = await fixture(t, (_req, res) => res.writeHead(201, { "content-length": payload.length }).end(payload));
  const proxy = await createThrottledProxy(origin, readNetworkProfile("1mbps-100ms"));
  t.after(proxy.close);
  const started = performance.now();
  const response = await fetch(proxy.url);
  const body = Buffer.from(await response.arrayBuffer());
  assert.equal(response.status, 201);
  assert.deepEqual(body, payload);
  assert.ok(performance.now() - started >= 330, "32 KB / 125 KB/s + 100 ms must not be released in a burst");
  assert.equal((await fetch(proxy.url, { method: "POST" })).status, 405);
});

test("gzip 바이트와 콘텐츠 인코딩을 함께 보존하고 고정 upstream만 호출한다", async (t) => {
  const original = "streaming content ".repeat(100);
  let path;
  const origin = await fixture(t, (req, res) => {
    path = req.url;
    const body = gzipSync(original);
    res.writeHead(200, { "content-encoding": "gzip", "content-length": body.length }).end(body);
  });
  const proxy = await createThrottledProxy(origin, readNetworkProfile("1mbps-100ms"));
  t.after(proxy.close);
  const response = await fetch(`${proxy.url}/products?slug=test`);
  assert.equal(await response.text(), original);
  assert.equal(path, "/products?slug=test");
});

test("스트리밍 셸은 upstream 완료를 기다리지 않고 먼저 전달한다", async (t) => {
  let finished = false;
  let finish;
  const gate = new Promise(resolve => { finish = resolve; });
  t.after(() => finish());
  const origin = await fixture(t, async (_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.write("shell");
    await gate;
    finished = true;
    res.end("content");
  });
  const proxy = await createThrottledProxy(origin, readNetworkProfile("1mbps-100ms"));
  t.after(proxy.close);
  const response = await fetch(proxy.url, { signal: AbortSignal.timeout(5000) });
  const reader = response.body.getReader();
  const first = await reader.read();
  assert.equal(new TextDecoder().decode(first.value), "shell");
  assert.equal(finished, false);
  finish();
  let rest = "";
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    rest += new TextDecoder().decode(chunk.value);
  }
  assert.equal(rest, "content");
});
