import { notFound } from "next/navigation";
import BlockingDashboard from "@/app/front-feature/nextjs/streaming/components/BlockingDashboard";
import StreamingDashboard from "@/app/front-feature/nextjs/streaming/components/StreamingDashboard";
import { resolveDashboardDelay } from "@/app/front-feature/nextjs/streaming/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DashboardResponsePage({
  params,
  searchParams,
}: {
  params: Promise<{ mode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ mode }, query] = await Promise.all([params, searchParams]);

  if (mode !== "blocking" && mode !== "streaming") notFound();
  if (query.dashboard && query.dashboard !== "workspace") notFound();

  const delay = resolveDashboardDelay(query.delay);

  return mode === "blocking"
    ? <BlockingDashboard delay={delay} />
    : <StreamingDashboard delay={delay} />;
}
