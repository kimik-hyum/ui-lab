import { createLoadingOptions, getActivity, getSummary } from "./data";
import { DataLoadingResult } from "../components/DataLoadingResult";

export async function ParallelData({ delayMs }: { delayMs: number }) {
  // [cmp:start:start]
  const options = createLoadingOptions(delayMs);
  // [cmp:start:end]

  // [cmp:wait:start]
  const [summary, activity] = await Promise.all([
    getSummary(options),
    getActivity(options),
  ]);
  // [cmp:wait:end]

  // [cmp:result:start]
  return <DataLoadingResult mode="parallel" tasks={[summary, activity]} delayMs={delayMs} />;
  // [cmp:result:end]
}
