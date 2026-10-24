import { notFound } from "next/navigation";
import { PrerenderedCounter } from "@/app/front-feature/nextjs/client-prerender/components/PrerenderedCounter";
import { ClientOnlyCounter } from "@/app/front-feature/nextjs/client-prerender/components/ClientOnlyCounter";
import { parseRun } from "@/app/front-feature/nextjs/client-prerender/config";

export const dynamic = "force-dynamic";

export default async function CounterDocument({ params, searchParams }: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ kind }, query] = await Promise.all([params, searchParams]);
  if (kind !== "prerender" && kind !== "client-only") notFound();
  return (
    <main
      data-client-prerender="v1"
      data-render-kind={kind}
      data-run={parseRun(query.run)}
      className="min-w-0 space-y-4 p-4 text-slate-800"
    >
      <h1 className="text-base font-semibold">같은 카운터 컴포넌트</h1>
      {kind === "prerender" ? <PrerenderedCounter /> : <ClientOnlyCounter />}
      <p data-client-prerender-ready="v1" className="text-xs leading-5 text-slate-500">
        문서마다 카운트 0으로 시작합니다.
      </p>
    </main>
  );
}
