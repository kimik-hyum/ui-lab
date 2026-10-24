import { createLoadingOptions, getActivity, getSummary } from "./data";
import { DataLoadingResult } from "../components/DataLoadingResult";

export async function SequentialData({ delayMs }: { delayMs: number }) {
  // [cmp:start:start]
  const options = createLoadingOptions(delayMs);
  // [cmp:start:end]

  // [cmp:wait:start]
  const summary = await getSummary(options);
  const activity = await getActivity(options);
  // [cmp:wait:end]

  // [cmp:result:start]
  return <DataLoadingResult mode="sequential" tasks={[summary, activity]} delayMs={delayMs} />;
  // [cmp:result:end]
}
