import { readFile } from "node:fs/promises";
import path from "node:path";
import { ClientPrerenderClientPage } from "./ClientPrerenderClientPage";

export default async function ClientPrerenderPage() {
  const [prerendered, clientOnly, counter, placeholder] = await Promise.all([
    readFile(path.join(process.cwd(), "app/front-feature/nextjs/client-prerender/components/PrerenderedCounter.tsx"), "utf8"),
    readFile(path.join(process.cwd(), "app/front-feature/nextjs/client-prerender/components/ClientOnlyCounter.tsx"), "utf8"),
    readFile(path.join(process.cwd(), "app/front-feature/nextjs/client-prerender/components/Counter.tsx"), "utf8"),
    readFile(path.join(process.cwd(), "app/front-feature/nextjs/client-prerender/components/CounterPlaceholder.tsx"), "utf8"),
  ]);
  const common = `\n// 공통: Counter.tsx\n${counter}`;
  return (
    <ClientPrerenderClientPage
      prerenderedCode={`// PrerenderedCounter.tsx\n${prerendered}${common}`}
      clientOnlyCode={`// ClientOnlyCounter.tsx\n${clientOnly}${common}\n// CounterPlaceholder.tsx\n${placeholder}`}
    />
  );
}
