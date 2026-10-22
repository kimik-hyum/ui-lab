import type { ListItem } from "../types";

export function ListRow({ item, total }: { item: ListItem; total: number }) {
  return (
    <div
      role="listitem"
      aria-posinset={item.number}
      aria-setsize={total}
      data-list-row={item.number}
      className="m-0 flex h-[48px] box-border items-center justify-between gap-2 border-b border-slate-100 bg-white px-3 text-sm"
    >
      <span className="min-w-0 truncate font-medium text-slate-700">{item.title}</span>
      <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{item.status}</span>
    </div>
  );
}
