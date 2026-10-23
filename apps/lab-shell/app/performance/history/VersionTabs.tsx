"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VersionTabs({ framework, label, versions, selected, children }: {
  framework: string;
  label: string;
  versions: string[];
  selected: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function selectVersion(value: unknown) {
    if (typeof value !== "string" || !versions.includes(value)) return;
    const query = new URLSearchParams(searchParams.toString());
    // Preserve selections in other framework sections, including older shared URLs.
    const legacyFramework = query.get("framework");
    const legacyVersion = query.get("version");
    if (legacyFramework && legacyVersion && legacyVersion !== "all") query.set(`version.${legacyFramework}`, legacyVersion);
    for (const key of ["framework", "version", "kind"]) query.delete(key);
    query.set(`version.${framework}`, value);
    startTransition(() => router.push(`/performance/history?${query}`, { scroll: false }));
  }

  return (
    <Tabs value={selected} onValueChange={selectVersion} aria-busy={pending} className="min-w-0 gap-0">
      <div className="overflow-x-auto border-b border-border px-5 sm:px-6">
        <TabsList aria-label={`${label} 버전`} variant="line" className="h-auto min-h-14 gap-4 p-0">
          {versions.map((version, index) => (
            <TabsTrigger key={version} value={version} disabled={pending} className="min-h-14 shrink-0 gap-2 rounded-none px-1 font-mono text-sm data-active:text-primary group-data-horizontal/tabs:after:bottom-0 after:bg-primary">
              {version}
              {index === 0 && version !== "미기록" && <span className="rounded bg-primary-subtle px-1.5 py-0.5 font-sans text-[10px] text-primary">최신</span>}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}
