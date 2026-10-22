"use client";

import { useEffect, useId, useState } from "react";
import type { ActivityDemoKind, ActivityEvent } from "../types";

export function ActivityProbe({ kind, onEvent }: {
  kind: ActivityDemoKind;
  onEvent: (event: ActivityEvent) => void;
}) {
  const inputId = useId();
  // [cmp:state-preservation:start]
  const [memo, setMemo] = useState("");
  // [cmp:state-preservation:end]

  // [cmp:background-effects:start]
  useEffect(() => {
    onEvent({ type: "setup" });
    const interval = window.setInterval(() => onEvent({ type: "tick" }), 500);
    return () => {
      window.clearInterval(interval);
      onEvent({ type: "cleanup" });
    };
  }, [onEvent]);
  // [cmp:background-effects:end]

  return (
    <div>
      {/* [cmp:state-preservation:start] */}
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-slate-700">메모</label>
      <input
        id={inputId}
        aria-label={kind === "css" ? "CSS 메모" : "Activity 메모"}
        value={memo}
        onChange={(event) => setMemo(event.target.value)}
        placeholder="숨기기 전에 메모를 입력하세요"
        className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800"
      />
      {/* [cmp:state-preservation:end] */}
      <p className="mt-3 text-xs leading-5 text-slate-500">다시 표시하면 입력했던 메모가 남아 있는지 확인하세요.</p>
    </div>
  );
}
