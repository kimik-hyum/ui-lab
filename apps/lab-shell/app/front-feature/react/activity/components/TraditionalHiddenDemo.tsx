"use client";

import { useReducer } from "react";
import { activityStatsReducer, INITIAL_ACTIVITY_STATS } from "../activity-stats";
import { ActivityDemoPanel } from "./ActivityDemoPanel";
import { ActivityProbe } from "./ActivityProbe";

export function TraditionalHiddenDemo({ hidden }: { hidden: boolean }) {
  const [stats, dispatch] = useReducer(activityStatsReducer, INITIAL_ACTIVITY_STATS);

  return (
    <ActivityDemoPanel kind="css" hidden={hidden} stats={stats}>
      {/* [cmp:hidden-strategy:start] */}
      <div className={hidden ? "hidden" : "block"}>
        <ActivityProbe kind="css" onEvent={dispatch} />
      </div>
      {/* [cmp:hidden-strategy:end] */}
    </ActivityDemoPanel>
  );
}
