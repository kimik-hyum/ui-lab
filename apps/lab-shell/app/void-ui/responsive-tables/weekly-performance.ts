export type PerformanceMetrics = { completed: number; target: number; rejected: number };
export type TimeSlot = PerformanceMetrics & { id: string; label: string };
export type PerformanceDay = {
  id: string;
  label: string;
  state: "past" | "current" | "upcoming";
  slots: readonly TimeSlot[];
};

const slotLabels = ["아침", "점심 피크", "점심 논피크", "저녁 피크", "저녁 논피크"];

function slots(targets: number[], completed = [0, 0, 0, 0, 0], rejected = [0, 0, 0, 0, 0]): TimeSlot[] {
  return targets.map((target, index) => ({
    id: `slot-${index}`, label: slotLabels[index], target,
    completed: completed[index], rejected: rejected[index],
  }));
}

// Fixed demonstration data: totals are always calculated from the child rows.
export const performanceDays: readonly PerformanceDay[] = [
  { id: "wed", label: "수요일", state: "past", slots: slots([7, 18, 15, 36, 16], [0, 1, 0, 1, 0], [0, 1, 0, 0, 0]) },
  { id: "thu", label: "목요일", state: "current", slots: slots([7, 18, 15, 36, 16], undefined, [0, 1, 0, 0, 0]) },
  { id: "fri", label: "금요일", state: "upcoming", slots: slots([7, 18, 15, 36, 16]) },
  { id: "sat", label: "토요일", state: "upcoming", slots: slots([17, 37, 28, 44, 19]) },
  { id: "sun", label: "일요일", state: "upcoming", slots: slots([17, 37, 28, 44, 19]) },
  { id: "mon", label: "월요일", state: "upcoming", slots: [] },
];

export function summarizeDay(day: PerformanceDay): PerformanceMetrics {
  return day.slots.reduce((total, slot) => ({
    completed: total.completed + slot.completed,
    target: total.target + slot.target,
    rejected: total.rejected + slot.rejected,
  }), { completed: 0, target: 0, rejected: 0 });
}

export function formatVolume(metrics: PerformanceMetrics) {
  return metrics.target ? `${metrics.completed}건/${metrics.target}건` : "-";
}

export function formatAchievement(metrics: PerformanceMetrics) {
  return metrics.target ? `${(metrics.completed / metrics.target * 100).toFixed(2)}%` : "-";
}

export function formatRejection(metrics: PerformanceMetrics) {
  return metrics.rejected
    ? `${metrics.rejected}건(${(metrics.rejected / (metrics.completed + metrics.rejected) * 100).toFixed(2)}%)`
    : "-";
}
