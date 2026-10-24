import type { ListCount, ListItem } from "./types";

export const ROW_HEIGHT = 48;
export const VIEWPORT_HEIGHT = 320;
export const LIST_COUNTS: readonly ListCount[] = [100, 1000, 10000];

const STATUSES = ["준비", "진행", "완료"] as const;

export function createListItems(count: ListCount): ListItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `task-${index + 1}`,
    number: index + 1,
    title: `작업 ${String(index + 1).padStart(5, "0")}`,
    status: STATUSES[index % STATUSES.length],
  }));
}

export function getJumpOffset(index: number, count: number): number {
  return Math.min(index * ROW_HEIGHT, Math.max(0, count * ROW_HEIGHT - VIEWPORT_HEIGHT));
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
