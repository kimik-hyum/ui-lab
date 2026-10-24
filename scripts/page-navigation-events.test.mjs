import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const directory = new URL('../apps/lab-shell/app/void-ui/pagination-infinite-scroll/', import.meta.url);
const source = readFileSync(new URL('page-navigation-events.ts', directory), 'utf8');

// helper가 사용하는 closest/focus 경계만 대체합니다.
// React 렌더링과 실제 pointer/blur/click 순서는 브라우저에서 확인합니다.
class ElementBoundary {
  constructor({ parent = null, group = false, command = false, disabled = false } = {}) {
    Object.assign(this, { parent, group, command, disabled, focusCalls: [] });
  }
  closest(selector) {
    for (let node = this; node; node = node.parent) {
      if (selector === '[data-page-navigation]' && node.group) return node;
      if (selector === 'button[data-page-command]:enabled' && node.command && !node.disabled) return node;
    }
    return null;
  }
  focus(options) { this.focusCalls.push(options); }
}

const exports = {};
runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports, Element: ElementBoundary });
const { focusPageNavigationCommand, shouldDiscardPageDraft } = exports;

function controls() {
  const group = new ElementBoundary({ group: true });
  const input = new ElementBoundary({ parent: group });
  const command = new ElementBoundary({ parent: group, command: true });
  return { group, input, command };
}

test('같은 그룹의 활성 이동 버튼으로 Tab/초점 이동할 때만 입력 초안을 취소한다', () => {
  const own = controls(), other = controls();
  assert.equal(shouldDiscardPageDraft({ currentTarget: own.input, relatedTarget: own.command }), true);
  assert.equal(shouldDiscardPageDraft({ currentTarget: own.input, relatedTarget: other.command }), false);
  const nested = new ElementBoundary({ parent: own.group, group: true });
  const nestedCommand = new ElementBoundary({ parent: nested, command: true });
  assert.equal(shouldDiscardPageDraft({ currentTarget: own.input, relatedTarget: nestedCommand }), false);
  own.command.disabled = true;
  assert.equal(shouldDiscardPageDraft({ currentTarget: own.input, relatedTarget: own.command }), false);
});

test('Enter의 프로그램 blur·일반 blur·다른 입력은 기존 입력 확정 경로로 남는다', () => {
  const { group, input } = controls();
  for (const target of [null, new ElementBoundary(), new ElementBoundary({ parent: group }), {}]) {
    assert.equal(shouldDiscardPageDraft({ currentTarget: input, relatedTarget: target }), false);
  }
});

test('주 포인터는 같은 그룹 버튼과 그 자식에 preventScroll 초점을 준다', () => {
  const { group, command } = controls();
  for (const target of [command, new ElementBoundary({ parent: command })]) {
    focusPageNavigationCommand({ button: 0, currentTarget: group, target });
  }
  assert.equal(command.focusCalls.length, 2);
  assert.ok(command.focusCalls.every((options) => options.preventScroll === true));
});

test('다른 그룹·중첩 그룹·비활성 버튼·보조 포인터는 초점을 바꾸지 않는다', () => {
  const own = controls(), other = controls();
  const nestedGroup = new ElementBoundary({ parent: own.group, group: true });
  const nestedCommand = new ElementBoundary({ parent: nestedGroup, command: true });
  focusPageNavigationCommand({ button: 0, currentTarget: own.group, target: other.command });
  focusPageNavigationCommand({ button: 0, currentTarget: own.group, target: nestedCommand });
  for (const button of [1, 2]) focusPageNavigationCommand({ button, currentTarget: own.group, target: own.command });
  own.command.disabled = true;
  focusPageNavigationCommand({ button: 0, currentTarget: own.group, target: own.command });
  for (const command of [own.command, other.command, nestedCommand]) assert.equal(command.focusCalls.length, 0);
});
