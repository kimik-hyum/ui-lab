import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';
import { registerHooks } from 'node:module';
const hook = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === './observation-response') return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const { requestObservation } = await import('../apps/lab-shell/app/ssr-lab/framework-dashboard/request-observation.ts');
hook.deregister();

const conditions = { team: 'alpha', delayMs: 400 };
const payload = { ok: false, framework: 'next', request: conditions, observedAt: '2026-10-22T00:00:00.000Z', source: null, upstreamStatus: null, metrics: null, html: null, error: { code: 'offline', message: '서버 연결을 확인하세요.' } };

async function originFor(t, handler) {
  const server = createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    const closed = once(server, 'close');
    server.close();
    server.closeAllConnections();
    await closed;
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  return (url, init) => fetch(new URL(url, origin), init);
}

for (const phase of ['headers', 'body']) {
  test(`실제 HTTP ${phase} 수신이 멈춰도 요청을 취소하고 재시도 안내를 반환한다`, async (t) => {
    let signal;
    const nativeFetch = await originFor(t, (_req, res) => {
      if (phase === 'body') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.write('{"ok":');
      }
    });
    const result = await requestObservation('next', conditions, new AbortController().signal, {
      fetchImpl: (url, init) => { signal = init.signal; return nativeFetch(url, init); }, timeoutMs: 150,
    });
    assert.equal(signal.aborted, true);
    assert.equal(result.kind, 'network-error');
    assert.match(result.message, /15초.*두 응답 다시 확인/);
  });
}

test('한쪽 시간 초과는 다른 쪽 성공을 취소하지 않고 다음 요청은 정상 완료한다', async (t) => {
  let nextCalls = 0;
  const fetchImpl = await originFor(t, (req, res) => {
    if (req.url.startsWith('/api/ssr-observer/next?') && nextCalls++ === 0) return;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ...payload, framework: req.url.startsWith('/api/ssr-observer/react-router?') ? 'react-router' : 'next' }));
  });
  const lifecycle = new AbortController();
  const [left, right] = await Promise.all([
    requestObservation('next', conditions, lifecycle.signal, { fetchImpl, timeoutMs: 150 }),
    requestObservation('react-router', conditions, lifecycle.signal, { fetchImpl, timeoutMs: 150 }),
  ]);
  assert.equal(left.kind, 'network-error');
  assert.equal(right.kind, 'response');
  assert.equal(lifecycle.signal.aborted, false);
  const retry = await requestObservation('next', conditions, lifecycle.signal, { fetchImpl, timeoutMs: 150 });
  assert.equal(retry.kind, 'response');
  assert.deepEqual(retry.value, payload);
});

test('메뉴 이동 취소는 진행 중인 본문 수신을 중단하고 오류 UI를 만들지 않는다', async (t) => {
  let arrived;
  const received = new Promise((resolve) => { arrived = resolve; });
  const fetchImpl = await originFor(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.write('{');
    arrived();
  });
  const lifecycle = new AbortController();
  const pending = requestObservation('next', conditions, lifecycle.signal, { fetchImpl, timeoutMs: 5000 });
  await received;
  lifecycle.abort();
  assert.equal(await pending, null);
  let called = false;
  assert.equal(await requestObservation('next', conditions, lifecycle.signal, { fetchImpl: () => { called = true; throw new Error('must not run'); } }), null);
  assert.equal(called, false);
});

test('성공·HTTP 오류·JSON 오류 모두 타이머와 취소 구독을 해제한다', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const response of [Response.json(payload), Response.json(payload, { status: 400 }), new Response('', { status: 503 }), new Response('{')]) {
    const lifecycle = new AbortController();
    let signal;
    let options;
    const result = await requestObservation('next', conditions, lifecycle.signal, {
      timeoutMs: 20,
      fetchImpl: async (url, init) => {
        assert.equal(url, '/api/ssr-observer/next?delay=400&team=alpha');
        signal = init.signal; options = init;
        return response;
      },
    });
    assert.equal(result.kind, [200, 400].includes(response.status) && response.headers.get('content-type')?.startsWith('application/json') ? 'response' : 'network-error');
    assert.equal(options.cache, 'no-store');
    t.mock.timers.tick(30);
    lifecycle.abort();
    assert.equal(signal.aborted, response.status === 503, 'HTTP 오류는 수신을 중단하고, 완료된 요청에는 timer/listener가 남지 않아야 합니다.');
  }
});

test('이전 조건의 JSON이 늦게 완성되어도 취소 후 결과를 반환하지 않는다', async () => {
  const lifecycle = new AbortController();
  let finish;
  const body = new Promise((resolve) => { finish = resolve; });
  const pending = requestObservation('next', conditions, lifecycle.signal, {
    fetchImpl: async () => ({ ok: true, json: () => body }),
  });
  lifecycle.abort();
  finish(payload);
  assert.equal(await pending, null);
});

test('잘못된 JSON 계약은 해당 요청의 안내로 끝나고 다른 프레임워크 결과를 보존한다', async () => {
  const controller = new AbortController();
  const fetchImpl = async (url) => Response.json(url.includes('/next?') ? {} : { ...payload, framework: 'react-router' });
  const [left, right] = await Promise.all([
    requestObservation('next', conditions, controller.signal, { fetchImpl }),
    requestObservation('react-router', conditions, controller.signal, { fetchImpl }),
  ]);
  assert.equal(left.kind, 'network-error');
  assert.match(left.message, /현재 조건.*재시도/);
  assert.equal(right.kind, 'response');
  assert.equal(right.value.framework, 'react-router');
  assert.equal(controller.signal.aborted, false);
  const retry = await requestObservation('next', conditions, controller.signal, { fetchImpl: async () => Response.json(payload) });
  assert.equal(retry.kind, 'response');
});
