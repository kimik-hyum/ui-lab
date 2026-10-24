import { notFound } from "next/navigation";
import { DirectTeamReads } from "@/app/front-feature/nextjs/request-cache/components/DirectTeamReads";
import { CachedTeamReads } from "@/app/front-feature/nextjs/request-cache/components/CachedTeamReads";
import { parsePattern } from "@/app/front-feature/nextjs/request-cache/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function RequestCacheResponse({ params, searchParams }: {
  params: Promise<{ mode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ mode }, query] = await Promise.all([params, searchParams]);
  if (mode !== "direct" && mode !== "cached") notFound();
  const pattern = parsePattern(query.pattern);
  return mode === "direct" ? <DirectTeamReads pattern={pattern} /> : <CachedTeamReads pattern={pattern} />;
}
