// [cmp:client-boundary:start]
"use client";
// [cmp:client-boundary:end]

import dynamic from "next/dynamic";
import CounterPlaceholder from "./CounterPlaceholder";

// [cmp:initial-output:start]
const Counter = dynamic(() => import("./Counter"), {
  ssr: false,
  loading: CounterPlaceholder,
});
// [cmp:initial-output:end]

export function ClientOnlyCounter() {
  return <Counter />;
}
