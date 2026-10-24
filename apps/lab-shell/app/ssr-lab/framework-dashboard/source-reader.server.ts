import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FrameworkId } from "./_lib/types";
import {
  FRAMEWORK_SOURCE_CATALOG,
  type ComparisonSource,
  type ComparisonSources,
  type SourceScopeId,
} from "./source-catalog";

type ReadSource = (file: string) => Promise<string>;

async function readScope(framework: FrameworkId, scope: SourceScopeId, readSource: ReadSource): Promise<ComparisonSource> {
  const files = [...FRAMEWORK_SOURCE_CATALOG[framework][scope].files];
  const parts = await Promise.all(files.map(async (file) => {
    const code = await readSource(file);
    return `// ${file}\n${code}`;
  }));
  return { code: parts.join("\n\n"), files };
}

async function readFramework(framework: FrameworkId, readSource: ReadSource): Promise<ComparisonSources[FrameworkId]> {
  const [entry, data, view, errors] = await Promise.all([
    readScope(framework, "entry", readSource),
    readScope(framework, "data", readSource),
    readScope(framework, "view", readSource),
    readScope(framework, "errors", readSource),
  ]);
  return { entry, data, view, errors };
}

export async function readFrameworkDashboardSources(): Promise<ComparisonSources> {
  // One read per file for this page, including files shared by multiple scopes.
  const pending = new Map<string, Promise<string>>();
  const readSource: ReadSource = (file) => {
    let code = pending.get(file);
    if (!code) {
      // next.config traces this allowlist explicitly; avoid tracing the whole monorepo.
      code = readFile(path.join(/* turbopackIgnore: true */ process.cwd(), "../..", file), "utf8");
      pending.set(file, code);
    }
    return code;
  };
  const [next, router, sveltekit, nuxt] = await Promise.all([
    readFramework("next", readSource),
    readFramework("react-router", readSource),
    readFramework("sveltekit", readSource),
    readFramework("nuxt", readSource),
  ]);
  return { next, "react-router": router, sveltekit, nuxt };
}
