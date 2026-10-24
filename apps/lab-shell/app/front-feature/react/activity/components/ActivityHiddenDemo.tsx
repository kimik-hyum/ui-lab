"use client";

import { Activity, useReducer } from "react";
import { activityStatsReducer, INITIAL_ACTIVITY_STATS } from "../activity-stats";
import { ActivityDemoPanel } from "./ActivityDemoPanel";
import { ActivityProbe } from "./ActivityProbe";

export function ActivityHiddenDemo({ hidden }: { hidden: boolean }) {
  const [stats, dispatch] = useReducer(activityStatsReducer, INITIAL_ACTIVITY_STATS);

  return (
    <ActivityDemoPanel kind="activity" hidden={hidden} stats={stats}>
      {/* [cmp:hidden-strategy:start] */}
      <Activity mode={hidden ? "hidden" : "visible"}>
        <ActivityProbe kind="activity" onEvent={dispatch} />
      </Activity>
      {/* [cmp:hidden-strategy:end] */}
    </ActivityDemoPanel>
  );
}
