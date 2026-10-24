import type { Ref, RefObject } from "react";

export type ListCount = 100 | 1000 | 10000;

export interface ListItem {
  id: string;
  number: number;
  title: string;
  status: string;
}

export interface ListDemoHandle {
  jumpTo(index: number): void;
}

export interface ListDemoProps {
  items: readonly ListItem[];
  savedScrollRef: RefObject<number>;
  ref: Ref<ListDemoHandle>;
}

export interface RowObservation {
  count: number;
  first: number | null;
  last: number | null;
}
