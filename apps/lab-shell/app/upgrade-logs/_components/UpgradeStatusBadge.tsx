import type { UpgradeStatus } from "../_lib/types";

const statuses: Record<UpgradeStatus, { label: string; style: string }> = {
  completed: { label: "적용 완료", style: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  "in-progress": { label: "진행 중", style: "bg-violet-50 text-violet-700 ring-violet-200" },
  blocked: { label: "확인 필요", style: "bg-amber-50 text-amber-800 ring-amber-200" },
  "rolled-back": { label: "되돌림", style: "bg-slate-100 text-slate-600 ring-slate-200" },
};

export default function UpgradeStatusBadge({ status }: { status: UpgradeStatus }) {
  const { label, style } = statuses[status];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}
