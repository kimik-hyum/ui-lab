/** Both charts and version rows use a zero baseline and a shared scale per metric. */
export default function TimeBar({ value, limit, emphasis = false }: { value: number; limit: number; emphasis?: boolean }) {
  return (
    <div aria-hidden="true" className="relative h-2.5 overflow-hidden rounded-sm bg-surface-elevated">
      <div className={`h-full rounded-sm ${emphasis ? "bg-primary" : "bg-slate-400"}`} style={{ width: `${Math.min(value / limit * 100, 100)}%` }} />
    </div>
  );
}
