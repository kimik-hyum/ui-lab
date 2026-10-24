import type { ActivityEvent, ActivityStats } from "./types";

export const INITIAL_ACTIVITY_STATS: ActivityStats = Object.freeze({
  setups: 0,
  cleanups: 0,
  ticks: 0,
});

export function activityStatsReducer(stats: ActivityStats, event: ActivityEvent): ActivityStats {
  switch (event.type) {
    case "setup": return { ...stats, setups: stats.setups + 1 };
    case "cleanup": return { ...stats, cleanups: stats.cleanups + 1 };
    case "tick": return { ...stats, ticks: stats.ticks + 1 };
  }
}
