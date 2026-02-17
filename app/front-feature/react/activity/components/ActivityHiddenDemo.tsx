'use client';

import { Activity, useEffect, useMemo, useState } from "react";
import type { MutableRefObject } from "react";
import type { WorkerStats } from "./TraditionalHiddenDemo";

interface ActivityHiddenDemoProps {
  hidden: boolean;
  tick: number;
  stats: WorkerStats;
  statsRef: MutableRefObject<WorkerStats>;
}

const WORK_UNITS_PER_RENDER = 140000;

const burnCpu = (seed: number) => {
  let result = 0;
  for (let i = 0; i < WORK_UNITS_PER_RENDER; i += 1) {
    result += Math.sqrt((i + 1) * (seed % 97));
  }
  return result;
};

function WorkerCore({
  tick,
  statsRef,
}: {
  tick: number;
  statsRef: MutableRefObject<WorkerStats>;
}) {
  const [effectPulse, setEffectPulse] = useState(0);
  const computeToken = useMemo(() => burnCpu(tick + effectPulse), [tick, effectPulse]);

  // [cmp:work-tracking:start]
  useEffect(() => {
    statsRef.current.renders += 1;
    statsRef.current.workUnits += WORK_UNITS_PER_RENDER;
  }, [computeToken, statsRef]);
  // [cmp:work-tracking:end]

  // [cmp:background-effects:start]
  useEffect(() => {
    const id = window.setInterval(() => {
      statsRef.current.effectTicks += 1;
      setEffectPulse((prev) => prev + 1);
    }, 220);

    return () => window.clearInterval(id);
  }, [statsRef]);
  // [cmp:background-effects:end]

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-xs text-zinc-400">
      계산 토큰: {Math.round(computeToken).toLocaleString()}
    </div>
  );
}

export function ActivityHiddenDemo({ hidden, tick, stats, statsRef }: ActivityHiddenDemoProps) {
  return (
    <div>
      <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-100">React Activity (mode=hidden)</h3>
          <span className={`text-[10px] uppercase tracking-wider ${hidden ? "text-amber-300" : "text-emerald-300"}`}>
            {hidden ? "hidden" : "visible"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded border border-zinc-800 bg-black/40 px-3 py-2">
            <p className="text-[11px] text-zinc-500">renders</p>
            <p className="text-zinc-200">{stats.renders}</p>
          </div>
          <div className="rounded border border-zinc-800 bg-black/40 px-3 py-2">
            <p className="text-[11px] text-zinc-500">effect ticks</p>
            <p className="text-zinc-200">{stats.effectTicks}</p>
          </div>
          <div className="rounded border border-zinc-800 bg-black/40 px-3 py-2">
            <p className="text-[11px] text-zinc-500">work units</p>
            <p className="text-zinc-200">{stats.workUnits.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
        {/* [cmp:hidden-strategy:start] */}
        <Activity mode={hidden ? "hidden" : "visible"}>
          <WorkerCore tick={tick} statsRef={statsRef} />
        </Activity>
        {/* [cmp:hidden-strategy:end] */}
      </div>
    </div>
  );
}
