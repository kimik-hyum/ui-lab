import { readFile } from "node:fs/promises";
import path from "node:path";
import { FrameworkDashboardClientPage } from "./FrameworkDashboardClientPage";
import { parseDashboardConditions, serializeDashboardConditions } from "./dashboard-conditions";
import { readFrameworkDashboardSources } from "./source-reader.server";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FrameworkDashboardPage({ searchParams }: Props) {
  const [sources, css, query] = await Promise.all([
    readFrameworkDashboardSources(),
    readFile(path.join(process.cwd(), "../../fixtures/dashboard-ssr.css"), "utf8"),
    searchParams,
  ]);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.append(key, value);
  }
  const initialConditions = parseDashboardConditions(params);
  return <FrameworkDashboardClientPage
    key={serializeDashboardConditions(initialConditions)}
    initialConditions={initialConditions}
    sources={sources}
    snapshotCss={css}
  />;
}
