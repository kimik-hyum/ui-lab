// [cmp:client-boundary:start]
"use client";
// [cmp:client-boundary:end]

import { useState } from "react";

export default function Counter() {
  // [cmp:interaction:start]
  const [count, setCount] = useState(0);
  // [cmp:interaction:end]

  return (
    <section data-counter="v1" className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">현재 카운트</p>
      {/* [cmp:interaction:start] */}
      <output data-counter-value aria-live="polite" className="block text-3xl font-semibold text-slate-800">
        {count}
      </output>
      <button
        type="button"
        data-counter-increment
        onClick={() => setCount((value) => value + 1)}
        className="min-h-11 rounded-lg bg-violet-600 px-4 text-sm text-white"
      >
        카운트 +1
      </button>
      {/* [cmp:interaction:end] */}
    </section>
  );
}
