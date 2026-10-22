import type { FocusEvent, PointerEvent } from "react";

const GROUP = "[data-page-navigation]";

function commandInGroup(target: EventTarget | null, group: Element | null): HTMLButtonElement | null {
  if (!group || !(target instanceof Element)) return null;
  const button = target.closest<HTMLButtonElement>("button[data-page-command]:enabled");
  return button?.closest(GROUP) === group ? button : null;
}

export function focusPageNavigationCommand(event: PointerEvent<HTMLDivElement>): void {
  if (event.button !== 0) return;
  // 포인터도 Tab과 같은 초점 이동을 거쳐 입력 초안보다 명령 버튼을 우선합니다.
  commandInGroup(event.target, event.currentTarget)?.focus({ preventScroll: true });
}

export function shouldDiscardPageDraft(event: FocusEvent<HTMLInputElement>): boolean {
  return commandInGroup(event.relatedTarget, event.currentTarget.closest(GROUP)) !== null;
}
