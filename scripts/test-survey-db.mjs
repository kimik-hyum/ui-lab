// Real PostgreSQL checks in a disposable container; never connects to a hosted DB.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const root = new URL('../', import.meta.url);
const container = `ui-lab-survey-test-${process.pid}`;
const image = 'public.ecr.aws/supabase/postgres:17.6.1.127';
function docker(args, input = '') {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve(stdout) : reject(new Error(`docker ${args[0]} failed (${code}): ${stderr}`)));
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}
const sql = (query) => docker(['exec', '-i', container, 'psql', '-X', '-At', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres'], query);
let started = false;
try {
  await docker(['run', '--detach', '--rm', '--name', container, '--network', 'none', '-e', 'POSTGRES_PASSWORD=postgres', image]);
  started = true;
  for (let attempt = 0; ; attempt++) {
    try { await sql('select 1;'); break; }
    catch (error) { if (attempt >= 29) throw error; await delay(1000); }
  }
  const migrations = (await readdir(new URL('supabase/migrations/', root))).filter((name) => name.endsWith('.sql')).sort();
  for (const name of migrations) {
    await sql(`begin;\n${await readFile(new URL(`supabase/migrations/${name}`, root), 'utf8')}\ncommit;`);
    console.log(`Migration passed: ${name}`);
  }
  const tap = await sql(await readFile(new URL('supabase/tests/survey.sql', root), 'utf8'));
  console.log(tap.split('\n').filter((line) => /^(ok |not ok |1\.\.|#)/.test(line)).join('\n'));
  assert.match(tap, /^1\.\.\d+$/m, 'pgTAP must finish and report its plan');
  assert.doesNotMatch(tap, /^(not ok|Bail out!)/m, 'pgTAP checks must all pass');

  // Two sessions intentionally overlap after the first RPC obtains its row lock.
  const user = '20000000-0000-0000-0000-000000000001';
  await sql(`insert into auth.users(id) values ('${user}');`);
  const submit = (options, reason, pause) => sql(`begin;
    set local role authenticated;
    select set_config('request.jwt.claim.sub','${user}',true);
    select public.submit_survey_response('responsive-tables-inner-v1',array[${options}], '${reason}');
    select pg_sleep(${pause}); commit;`);
  const results = await Promise.allSettled([
    submit("'scroll','sticky'", 'two choices', 0.4),
    submit("'cards','sticky','stacked'", 'three choices', 0),
  ]);
  for (const result of results) { if (result.status === 'rejected') throw result.reason; }
  const state = JSON.parse((await sql(`select json_build_object(
    'responses',(select count(*) from public.survey_responses where user_id='${user}'),
    'reason',r.reason,'options',array_agg(o.option_key order by o.option_key))
    from public.survey_responses r join public.response_options ro on ro.response_id=r.id
    join public.survey_options o on o.id=ro.option_id where r.user_id='${user}' group by r.id;`)).trim());
  assert.equal(state.responses, 1);
  assert.deepEqual(state.options, state.reason === 'two choices' ? ['scroll', 'sticky'] : ['cards', 'stacked', 'sticky']);
  console.log('Concurrency passed: one complete response, no mixed choices.');
} finally {
  if (started) await docker(['rm', '--force', container]);
}
