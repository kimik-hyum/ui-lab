/* One contract for the saved report, collector, and browser presentation. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UI_LAB_REPORT_DATA = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const FRAMEWORKS = Object.freeze({ next: 'Next.js', 'react-router': 'React Router', sveltekit: 'SvelteKit', nuxt: 'Nuxt' });
  const METRICS = Object.freeze(['responseStartMs', 'firstByteMs', 'contentReadyMs', 'totalMs', 'htmlBytes']);
  const STAT_METRICS = Object.freeze(['contentReadyMs', 'firstByteMs', 'totalMs', 'htmlBytes']);
  const PATH = '/scenarios/dashboard-ssr';
  const SCENARIO = Object.freeze({ path: PATH, team: 'alpha', delayMs: 0, renderMode: 'blocking', marker: 'data-dashboard-ready="v1"', fixture: 'deterministic' });
  const METHOD = Object.freeze({ runs: 20, warmup: 3, order: 'rotating-sequential', scope: 'observer-server-to-framework', cache: 'no-store' });

  function requireValue(condition, message) {
    if (!condition) throw new Error(`리포트 데이터 오류: ${message}`);
  }
  function record(value, name, keys) {
    requireValue(value !== null && typeof value === 'object' && !Array.isArray(value), `${name} 객체가 필요합니다.`);
    if (keys) requireValue(Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)), `${name} 필드가 일치하지 않습니다.`);
    return value;
  }
  function text(value, name) {
    requireValue(typeof value === 'string' && value.trim().length > 0, `${name} 문자열이 필요합니다.`);
  }
  function timestamp(value, name) {
    requireValue(typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value, `${name}은 ISO 날짜여야 합니다.`);
    return Date.parse(value);
  }
  function exact(value, expected, name) {
    record(value, name, Object.keys(expected));
    for (const [key, entry] of Object.entries(expected)) requireValue(value[key] === entry, `${name}.${key} 조건이 다릅니다.`);
  }
  function version(value) {
    requireValue(typeof value === 'string' && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(value), '설치 버전이 올바르지 않습니다.');
  }
  function metrics(value) {
    record(value, 'metrics', METRICS);
    for (const key of METRICS) requireValue(typeof value[key] === 'number' && Number.isFinite(value[key]) && value[key] >= 0, `${key}는 0 이상의 실제 측정값이어야 합니다.`);
    requireValue(Number.isSafeInteger(value.htmlBytes) && value.htmlBytes > 0 && value.htmlBytes <= 1024 * 1024, 'htmlBytes 범위를 벗어났습니다.');
    requireValue(value.responseStartMs <= value.firstByteMs && value.firstByteMs <= value.contentReadyMs && value.contentReadyMs <= value.totalMs, '응답 시간 순서가 올바르지 않습니다.');
    return value;
  }
  function summarize(values) {
    requireValue(Array.isArray(values) && values.length > 0 && values.every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0), '통계에는 비어 있지 않은 숫자 배열이 필요합니다.');
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    const round = (value) => Math.round(value * 100) / 100;
    return { min: round(sorted[0]), median: round(median), p95: round(sorted[Math.ceil(sorted.length * 0.95) - 1]) };
  }
  function validateObservation(value, framework) {
    requireValue(Object.hasOwn(FRAMEWORKS, framework), '알 수 없는 프레임워크입니다.');
    record(value, '관찰 응답', ['ok', 'framework', 'request', 'observedAt', 'source', 'upstreamStatus', 'metrics', 'html', 'error']);
    requireValue(value.ok === true && value.framework === framework && value.upstreamStatus === 200 && value.error === null, `${framework} 관찰이 성공하지 않았습니다.`);
    exact(value.request, { team: 'alpha', delayMs: 0 }, 'request');
    record(value.source, 'source', ['label', 'version', 'path', 'renderMode']);
    requireValue(value.source.label === FRAMEWORKS[framework] && value.source.path === PATH && value.source.renderMode === 'blocking', `${framework} source 조건이 다릅니다.`);
    version(value.source.version);
    timestamp(value.observedAt, 'observedAt');
    metrics(value.metrics);
    requireValue(typeof value.html === 'string' && value.html.startsWith('<main ') && value.html.endsWith('</main>'), '관찰에 성공한 본문이 필요합니다.');
    return value;
  }
  function parseReport(value) {
    record(value, 'report', ['schemaVersion', 'id', 'title', 'generatedAt', 'startedAt', 'scenario', 'method', 'environment', 'provenance', 'targets']);
    requireValue(value.schemaVersion === 1 && value.id === 'dashboard-ssr', '지원하지 않는 리포트입니다.');
    text(value.title, 'title');
    const started = timestamp(value.startedAt, 'startedAt');
    const generated = timestamp(value.generatedAt, 'generatedAt');
    requireValue(started <= generated, '생성 시각이 시작 시각보다 빠릅니다.');
    exact(value.scenario, SCENARIO, 'scenario');
    exact(value.method, METHOD, 'method');
    record(value.environment, 'environment', ['node', 'platform', 'arch', 'cpu', 'timeZone', 'network']);
    for (const key of ['node', 'platform', 'arch', 'cpu', 'timeZone']) text(value.environment[key], `environment.${key}`);
    requireValue(value.environment.network === 'loopback', '같은 머신의 loopback 측정만 지원합니다.');
    const provenance = record(value.provenance, 'provenance', ['gitCommit', 'dirty', 'sourceDigest', 'sourceFiles']);
    requireValue(typeof provenance.gitCommit === 'string' && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(provenance.gitCommit), 'gitCommit이 올바르지 않습니다.');
    requireValue(typeof provenance.dirty === 'boolean' && /^[a-f0-9]{64}$/.test(provenance.sourceDigest), '소스 상태가 올바르지 않습니다.');
    requireValue(Array.isArray(provenance.sourceFiles) && provenance.sourceFiles.length > 0, '소스 파일 기록이 없습니다.');
    let previous = '';
    for (const file of provenance.sourceFiles) {
      record(file, 'sourceFiles 항목', ['path', 'sha256']);
      requireValue(typeof file.path === 'string' && /^(?:[A-Za-z0-9_.@+\[\]-]+\/)*[A-Za-z0-9_.@+\[\]-]+$/.test(file.path) && !file.path.split('/').some((part) => part === '..' || part === '.') && file.path > previous, '소스 경로는 중복 없이 정렬된 저장소 상대 경로여야 합니다.');
      requireValue(typeof file.sha256 === 'string' && /^[a-f0-9]{64}$/.test(file.sha256), '파일 SHA-256이 올바르지 않습니다.');
      previous = file.path;
    }
    requireValue(Array.isArray(value.targets) && value.targets.length === 4, '네 프레임워크 결과가 모두 필요합니다.');
    const ids = new Set();
    for (const target of value.targets) {
      record(target, 'target', ['id', 'label', 'version', 'renderMode', 'path', 'statistics', 'samples']);
      requireValue(Object.hasOwn(FRAMEWORKS, target.id) && !ids.has(target.id), '프레임워크가 중복되었거나 알 수 없습니다.');
      ids.add(target.id);
      requireValue(target.label === FRAMEWORKS[target.id] && target.path === PATH && target.renderMode === 'blocking', `${target.id} 조건이 다릅니다.`);
      version(target.version);
      requireValue(Array.isArray(target.samples) && target.samples.length === METHOD.runs, `${target.id}의 측정 20회가 필요합니다.`);
      let observed = started;
      for (const [index, sample] of target.samples.entries()) {
        record(sample, 'sample', ['run', 'observedAt', 'metrics']);
        requireValue(sample.run === index + 1, '측정 회차가 연속되지 않습니다.');
        const time = timestamp(sample.observedAt, 'sample.observedAt');
        requireValue(time >= observed && time <= generated, '측정 시각이 수집 범위를 벗어났습니다.');
        observed = time;
        metrics(sample.metrics);
      }
      record(target.statistics, 'statistics', STAT_METRICS);
      for (const key of STAT_METRICS) {
        exact(target.statistics[key], summarize(target.samples.map((sample) => sample.metrics[key])), `statistics.${key}`);
      }
    }
    return value;
  }
  return Object.freeze({ FRAMEWORKS, METRICS, STAT_METRICS, SCENARIO, METHOD, summarize, validateObservation, parseReport });
});
