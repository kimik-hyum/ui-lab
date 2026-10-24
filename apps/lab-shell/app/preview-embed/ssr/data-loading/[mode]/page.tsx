import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SequentialData } from "../../../../ssr-lab/data-loading/server/SequentialData";
import { ParallelData } from "../../../../ssr-lab/data-loading/server/ParallelData";
import { parseDelay } from "../../../../ssr-lab/data-loading/server/data";

export default async function DataLoadingRun({ params, searchParams }: {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ delay?: string | string[] }>;
}) {
  await connection();
  const { mode } = await params;
  if (mode !== "sequential" && mode !== "parallel") notFound();
  const delayMs = parseDelay((await searchParams).delay);
  return mode === "sequential" ? <SequentialData delayMs={delayMs} /> : <ParallelData delayMs={delayMs} />;
}
