import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const fixture = JSON.parse(await readFile(new URL("fixtures/dashboard-ssr.json", root), "utf8"));
const files = {
  next: "apps/next-lab/app/scenarios/dashboard-ssr/_lib/dashboard-ssr-data.server.ts",
  "react-router": "apps/react-router-lab/app/scenarios/dashboard-ssr/lib/dashboard-ssr-data.server.ts",
  sveltekit: "apps/sveltekit-lab/src/lib/server/scenarios/dashboard-ssr.ts",
  nuxt: "apps/vue-lab/server/utils/scenarios/dashboard-ssr.ts",
};

async function scenario(id) {
  const source = await readFile(new URL(files[id], root), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const timers = [];
  const setTimeout = (resolve, delay) => { timers.push({ delay, resolve }); return timers.length; };
  const module = { exports: {} };
  // 실제 helper를 실행하며 타이머만 수동으로 완료합니다. 서버·실시간 지연은 만들지 않습니다.
  new vm.Script(compiled, { filename: files[id] }).runInNewContext({
    module, exports: module.exports, setTimeout,
    require(specifier) {
      if (specifier === "server-only") return {};
      if (specifier === "node:timers/promises") return { setTimeout: (delay) => new Promise((resolve) => setTimeout(resolve, delay)) };
      if (specifier.endsWith("fixtures/dashboard-ssr.json")) return fixture;
      throw new Error(`테스트에서 예상하지 않은 helper 의존성: ${specifier}`);
    },
  });
  const api = module.exports;
  return {
    timers,
    async load(team, rawDelay) {
      if (id === "next" || id === "react-router") return api.loadDashboardSsr(team, api.resolveDashboardDelay(rawDelay));
      if (id === "sveltekit") {
        const query = new URLSearchParams();
        if (team !== undefined) query.set("team", team);
        if (rawDelay !== undefined) query.set("delay", rawDelay);
        return (await api.getDashboardSsr(query)).dashboard;
      }
      return (await api.getDashboardSsr({ team, delay: rawDelay }))?.dashboard ?? null;
    },
  };
}

for (const id of Object.keys(files)) {
  test(`${id}: 0ms는 정상·빈 팀·없는 팀 모두 타이머를 호출하지 않는다`, async () => {
    const { timers, load } = await scenario(id);
    const alpha = await load("alpha", "0");
    const empty = await load("empty", "0");
    const missing = await load("missing", "0");
    assert.equal(timers.length, 0);
    assert.equal(alpha.team.id, "alpha");
    assert.equal(alpha.activities.length, 3);
    assert.equal(empty.team.id, "empty");
    assert.ok(empty.summary.every((item) => item.value === 0));
    assert.equal(empty.activities.length, 0);
    assert.equal(missing, null);
  });

  test(`${id}: 400/800ms는 한 번 기다린 뒤 정상·빈 팀·없는 팀을 판별한다`, async () => {
    const { timers, load } = await scenario(id);
    for (const delay of [400, 800]) for (const team of ["alpha", "empty", "missing"]) {
      const previous = timers.length;
      let settled = false;
      const pending = load(team, String(delay)).then((value) => { settled = true; return value; });
      await Promise.resolve();
      assert.equal(timers.length, previous + 1, `${team}에도 서버 대기가 한 번 필요합니다.`);
      assert.equal(timers.at(-1).delay, delay);
      assert.equal(settled, false, "타이머가 끝나기 전에 없는 팀도 반환하면 안 됩니다.");
      timers.at(-1).resolve();
      const result = await pending;
      assert.equal(result?.team.id ?? null, team === "missing" ? null : team);
    }
  });

  test(`${id}: 생략하거나 허용하지 않은 지연은 기존 기본값 400ms를 유지한다`, async () => {
    const { timers, load } = await scenario(id);
    for (const value of [undefined, "-1", "1", "1200", "not-a-delay"]) {
      const pending = load("alpha", value);
      assert.equal(timers.at(-1).delay, 400);
      timers.at(-1).resolve();
      assert.equal((await pending).team.id, "alpha");
    }
  });
}
