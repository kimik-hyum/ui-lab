import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { getEventListeners, once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { ARTICLE_REQUEST_TIMEOUT_MS, requestArticle } from '../apps/lab-shell/app/front-feature/nextjs/rsc-vs-csc/request-article.ts';
import { collectAnchorLines, stripAnchorLines } from '../apps/lab-shell/app/front-feature/components/codeAnchors.ts';

const article = { id: 'test', title: '본문', intro: '서버 응답', sections: [] };

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
  test(`HTTP ${phase} 수신이 멈추면 전체 요청 제한 시간에 중단하고 다음 요청은 성공한다`, { timeout: 5000 }, async (t) => {
    let signal;
    let calls = 0;
    const nativeFetch = await originFor(t, (_req, res) => {
      if (calls++ === 0) {
        if (phase === 'body') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.write('{"id":');
        }
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(article));
    });
    const fetchImpl = (url, init) => { signal = init.signal; return nativeFetch(url, init); };
    const lifecycle = new AbortController();
    const timedOut = await requestArticle(0, 0, lifecycle.signal, { fetchImpl, timeoutMs: 150 });
    assert.equal(ARTICLE_REQUEST_TIMEOUT_MS, 15_000);
    assert.equal(signal.aborted, true);
    assert.equal(lifecycle.signal.aborted, false, '시간 초과가 컴포넌트 수명주기까지 취소해서는 안 됩니다.');
    assert.equal(timedOut.kind, 'error');
    assert.match(timedOut.message, /15초.*JSON/);
    assert.deepEqual(await requestArticle(0, 1, lifecycle.signal, { fetchImpl, timeoutMs: 1000 }), { kind: 'success', article });
  });
}

test('조건 변경이나 언마운트는 진행 중인 JSON 수신을 취소하며 오류를 반환하지 않는다', { timeout: 5000 }, async (t) => {
  let arrived;
  const received = new Promise((resolve) => { arrived = resolve; });
  let signal;
  const nativeFetch = await originFor(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.write('{');
    arrived();
  });
  const lifecycle = new AbortController();
  const pending = requestArticle(1000, 2, lifecycle.signal, {
    fetchImpl: (url, init) => { signal = init.signal; return nativeFetch(url, init); },
  });
  await received;
  lifecycle.abort();
  assert.equal(await pending, null);
  assert.equal(signal.aborted, true);
  assert.equal(getEventListeners(lifecycle.signal, 'abort').length, 0);
  assert.equal(await requestArticle(0, 3, lifecycle.signal, { fetchImpl: () => assert.fail('이미 취소된 요청을 시작했습니다.') }), null);
});

test('새 요청 성공 뒤 이전 JSON이 늦게 도착해도 이전 결과는 버려진다', async () => {
  let finishOld;
  const oldBody = new Promise((resolve) => { finishOld = resolve; });
  const oldLifecycle = new AbortController();
  const oldRequest = requestArticle(3000, 0, oldLifecycle.signal, {
    fetchImpl: async () => ({ ok: true, json: () => oldBody }),
  });
  oldLifecycle.abort();
  const current = await requestArticle(0, 1, new AbortController().signal, {
    fetchImpl: async () => Response.json(article),
  });
  finishOld({ ...article, title: '이전 응답' });
  assert.deepEqual(current, { kind: 'success', article });
  assert.equal(await oldRequest, null);
});

test('시간 초과와 화면 이동이 겹치면 취소된 화면에 오류 결과를 보내지 않는다', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let finish;
  const body = new Promise((resolve) => { finish = resolve; });
  const lifecycle = new AbortController();
  let signal;
  const pending = requestArticle(0, 0, lifecycle.signal, {
    timeoutMs: 20,
    fetchImpl: async (_url, init) => { signal = init.signal; return { ok: true, json: () => body }; },
  });
  t.mock.timers.tick(20);
  assert.equal(signal.aborted, true);
  lifecycle.abort();
  finish(article);
  assert.equal(await pending, null);
});

test('시간 초과 후 취소를 무시하고 끝난 JSON도 성공으로 집계되지 않는다', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let finish;
  const body = new Promise((resolve) => { finish = resolve; });
  const pending = requestArticle(0, 0, new AbortController().signal, {
    timeoutMs: 20, fetchImpl: async () => ({ ok: true, json: () => body }),
  });
  t.mock.timers.tick(20);
  finish(article);
  assert.equal((await pending).kind, 'error');
});

test('성공·HTTP 오류·잘못된 JSON 모두 타이머와 취소 구독을 정리한다', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const [response, kind, message] of [
    [Response.json(article), 'success', null],
    [new Response('', { status: 503 }), 'error', /HTTP 503/],
    [new Response('{'), 'error', /JSON/],
  ]) {
    const lifecycle = new AbortController();
    let signal;
    const result = await requestArticle(500, 7, lifecycle.signal, {
      timeoutMs: 20,
      fetchImpl: async (url, init) => {
        assert.equal(url, '/api/rsc-demo?delay=500&run=7');
        assert.equal(init.cache, 'no-store');
        signal = init.signal;
        return response;
      },
    });
    assert.equal(result.kind, kind);
    if (message) assert.match(result.message, message);
    assert.equal(getEventListeners(lifecycle.signal, 'abort').length, 0);
    t.mock.timers.tick(30);
    lifecycle.abort();
    assert.equal(signal.aborted, kind === 'error', '오류는 수신을 중단하며 성공한 요청에는 타이머가 남지 않습니다.');
  }
});

test('실제 비교 소스의 토픽은 helper의 fetch·JSON과 시간 제한·정리 줄을 구분한다', async () => {
  const root = new URL('../apps/lab-shell/app/front-feature/nextjs/rsc-vs-csc/', import.meta.url);
  const [viewer, helper] = await Promise.all([
    readFile(new URL('components/CscArticleViewer.tsx', root), 'utf8'),
    readFile(new URL('request-article.ts', root), 'utf8'),
  ]);
  const source = `// components/CscArticleViewer.tsx\n${viewer}\n// request-article.ts\n${helper}`;
  const anchors = collectAnchorLines(source);
  const lines = stripAnchorLines(source).split('\n');
  const selected = (id) => anchors[id].map((line) => lines[line - 1]).join('\n');
  assert.match(selected('client-boundary'), /"use client"/);
  assert.match(selected('data-fetching'), /await fetchImpl/);
  assert.match(selected('data-fetching'), /await response\.json\(\)/);
  assert.match(selected('loading-state'), /setTimeout/);
  assert.match(selected('loading-state'), /clearTimeout/);
  assert.match(selected('loading-state'), /removeEventListener/);
  const occupied = new Set();
  for (const id of ['client-boundary', 'data-fetching', 'loading-state']) {
    assert(anchors[id].length > 0);
    for (const line of anchors[id]) {
      assert(!occupied.has(line), `${id}의 ${line}번째 줄은 다른 토픽과 겹칩니다.`);
      occupied.add(line);
    }
  }
});
