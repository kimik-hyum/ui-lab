import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseObservationResponse } from '../apps/lab-shell/app/ssr-lab/framework-dashboard/observation-response.ts';

const request = { team: 'alpha', delayMs: 400 };
const success = {
  ok: true, framework: 'next', request, observedAt: '2026-10-22T00:00:00.000Z',
  source: { label: 'Next.js', version: '16.4.2', path: '/scenarios/dashboard-ssr', renderMode: 'blocking' },
  upstreamStatus: 200, metrics: { responseStartMs: 401, firstByteMs: 402, contentReadyMs: 403, totalMs: 404, htmlBytes: 1234 },
  html: '<main data-dashboard-ssr="v1">실제 본문</main>', error: null,
};
const failure = {
  ...success, ok: false, upstreamStatus: 404, metrics: null, html: null,
  error: { code: 'not-found', message: '팀을 찾을 수 없습니다.' },
};
const parse = (value, framework = 'next', conditions = request) => parseObservationResponse(value, framework, conditions);

test('정상·404·연결 실패·불완전 HTML의 오류 응답은 원본 관찰값을 그대로 보존한다', () => {
  for (const value of [success, failure,
    { ...failure, source: null, upstreamStatus: null, error: { code: 'offline', message: '연결 실패' } },
    { ...failure, upstreamStatus: 200, metrics: { ...success.metrics, contentReadyMs: null }, error: { code: 'invalid-payload', message: '완료 마커 누락' } },
  ]) assert.equal(parse(value), value);
});

test('빈 JSON·누락·잘못된 타입은 렌더링 전에 거부한다', () => {
  for (const value of [null, [], {}, 'html', { ...success, ok: 'true' },
    { ...success, source: { ...success.source, version: 16 } },
    { ...success, metrics: [] }, { ...success, html: null }, { ...success, error: {} },
    { ...success, observedAt: 'invalid-date' }, { ...success, upstreamStatus: '200' },
    { ...failure, error: null }, { ...failure, error: { code: 'unknown', message: '오류' } },
    { ...failure, error: { code: 'offline', message: 500 } },
    { ...failure, upstreamStatus: 600 }, { ...failure, html: '<main />' },
  ]) assert.equal(parse(value), null, JSON.stringify(value));
  for (const original of [success, failure]) {
    for (const key of Object.keys(original)) {
      const value = { ...original };
      delete value[key];
      assert.equal(parse(value), null, `필수 필드 ${key}`);
    }
  }
});

test('모든 측정값은 유한·음수 아님을 확인하며 성공 시 도착 시각과 본문 바이트가 필요하다', () => {
  for (const key of Object.keys(success.metrics)) {
    for (const invalid of [undefined, '1', -1, NaN, Infinity, -Infinity]) {
      assert.equal(parse({ ...success, metrics: { ...success.metrics, [key]: invalid } }), null, `${key}: ${invalid}`);
    }
  }
  for (const invalid of [
    { firstByteMs: null }, { contentReadyMs: null }, { htmlBytes: 0 }, { htmlBytes: 1.5 },
    { firstByteMs: 400 }, { contentReadyMs: 401 }, { totalMs: 402 },
  ]) assert.equal(parse({ ...success, metrics: { ...success.metrics, ...invalid } }), null);
});

test('다른 프레임워크·조건·경로·렌더 방식의 응답을 현재 결과에 섞지 않는다', () => {
  assert.equal(parse(success, 'nuxt'), null);
  assert.equal(parse(success, 'next', { team: 'empty', delayMs: 400 }), null);
  assert.equal(parse(success, 'next', { team: 'alpha', delayMs: 0 }), null);
  assert.equal(parse({ ...success, request: { ...request, delayMs: '400' } }), null);
  assert.equal(parse({ ...success, source: { ...success.source, path: '/other' } }), null);
  assert.equal(parse({ ...success, source: { ...success.source, renderMode: 'streaming' } }), null);
  assert.equal(parse({ ...failure, framework: null }), null);
});
