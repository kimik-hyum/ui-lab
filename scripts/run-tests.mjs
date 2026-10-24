import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const mode = process.argv[2] ?? 'local';
if (!['local', 'runtime'].includes(mode)) {
  throw new Error('검사 종류는 local 또는 runtime이어야 합니다.');
}

const serverOnly = new Set([
  'cache-comparison.test.mjs',
  'framework-dashboard.test.mjs',
  'ssr-experiments.test.mjs',
]);
const mixed = new Set(['client-prerender.test.mjs', 'request-cache.test.mjs']);
const env = { ...process.env };

if (mode === 'runtime') {
  if (!env.UI_LAB_BASE_URL) {
    throw new Error('현재 코드를 실행하는 서버의 UI_LAB_BASE_URL을 지정하세요.');
  }
  const url = new URL(env.UI_LAB_BASE_URL);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('UI_LAB_BASE_URL은 HTTP(S) 주소여야 합니다.');
  }
  env.UI_LAB_CLIENT_PRERENDER_BASE_URL = url.href;
  env.UI_LAB_REQUEST_CACHE_BASE_URL = url.href;
} else {
  // 기본 검사는 셸에 남아 있는 서버 주소에도 의존하지 않습니다.
  delete env.UI_LAB_CLIENT_PRERENDER_BASE_URL;
  delete env.UI_LAB_REQUEST_CACHE_BASE_URL;
}

const files = readdirSync(new URL('./', import.meta.url))
  .filter((name) => name.endsWith('.test.mjs'))
  .filter((name) => mode === 'runtime' ? serverOnly.has(name) || mixed.has(name) : !serverOnly.has(name))
  .sort()
  .map((name) => `scripts/${name}`);

const result = spawnSync(process.execPath, ['--test', ...files], { cwd: root, env, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
