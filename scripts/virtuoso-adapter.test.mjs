import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../apps/lab-shell/app/void-ui/pagination-infinite-scroll/examples/virtuoso-adapter-example.ts', import.meta.url), 'utf8');
const exports = {};
runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports });

function setup() {
  const bounds = { first: 5, count: 20 };
  const moves = [];
  const adapter = exports.createVirtuosoAdapter({
    pageSize: 10,
    getTotalCount: () => bounds.count,
    getFirstLoadedPage: () => bounds.first,
    scrollToIndex: (value) => moves.push(value),
    loadMoreThreshold: 2,
  });
  return { adapter, bounds, moves };
}

test('prepend 후에도 절대 범위로 현재 페이지를 계산하고 끝 경계를 갱신한다', () => {
  const { adapter, bounds } = setup();
  const pages = [];
  let next = 0;
  adapter.watchCurrentPage((page) => pages.push(page));
  adapter.watchLoadMore(() => next++);
  adapter.onRangeChanged({ startIndex: 41, endIndex: 47 });
  assert.deepEqual(pages, [5]);
  assert.equal(next, 0);
  bounds.first = 4; bounds.count = 30;
  adapter.onRangeChanged({ startIndex: 41, endIndex: 47 });
  assert.deepEqual(pages, [5, 5]);
  assert.equal(next, 0);
  adapter.onRangeChanged({ startIndex: 53, endIndex: 59 });
  assert.equal(next, 1);
});

test('위쪽 로딩은 구독 이후 위쪽 경계로 이동할 때만 호출하고 정리 후 멈춘다', () => {
  const { adapter } = setup();
  let previous = 0;
  adapter.onScroll(100); adapter.onScroll(0);
  const stop = adapter.watchLoadPrevious(() => previous++);
  adapter.onRangeChanged({ startIndex: 41, endIndex: 47 });
  adapter.onScroll(0); adapter.onScroll(300); adapter.onScroll(220);
  assert.equal(previous, 0);
  adapter.onScroll(180);
  assert.equal(previous, 1);
  stop(); adapter.onScroll(0);
  assert.equal(previous, 1);
});

test('페이지 이동은 prepend 전후 모두 현재 목록의 상대 인덱스로 요청한다', () => {
  const { adapter, bounds, moves } = setup();
  adapter.scrollToPage(6, 'auto');
  assert.equal(moves[0].index, 10);
  bounds.first = 4; bounds.count = 30;
  adapter.scrollToPage(6, 'auto');
  assert.equal(moves[1].index, 20);
});
