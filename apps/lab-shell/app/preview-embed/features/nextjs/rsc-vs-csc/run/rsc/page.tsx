import { notFound } from "next/navigation";
import { RscArticleViewer } from "@/app/front-feature/nextjs/rsc-vs-csc/components/RscArticleViewer";
import { resolveArticleDelay } from "@/app/front-feature/nextjs/rsc-vs-csc/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function RscArticleResponsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  if (query.article && query.article !== "rendering-guide") notFound();
  return <RscArticleViewer delay={resolveArticleDelay(query.delay)} />;
}
