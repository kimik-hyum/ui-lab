import Link from "next/link";
import LabIcon from "../../components/LabIcon";
import type { FeatureCatalogSection } from "./FeatureCatalogTypes";

interface FeatureCatalogProps {
  title: string;
  description: string;
  sections: FeatureCatalogSection[];
}

export function FeatureCatalog({ title, description, sections }: FeatureCatalogProps) {
  const isDev = process.env.NODE_ENV === "development";
  const visibleSections = isDev
    ? sections
    : sections
        .map((section) => ({
          ...section,
          features: section.features.filter((feature) => feature.status !== "planned"),
        }))
        .filter((section) => section.features.length > 0);
  const availableCount = visibleSections.reduce(
    (count, section) => count + section.features.filter((feature) => feature.status === "available").length,
    0,
  );

  return (
    <main className="workspace-page space-y-8">
      <header className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <p className="mb-2 font-mono text-[10px] font-medium tracking-[0.15em] text-accent">
              EXPERIMENT CATALOG
            </p>
            <h1 className="text-[28px] font-bold tracking-[-0.9px] sm:text-[31px]">
              {title}<span className="ml-2 text-accent">.</span>
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-white px-4 py-2.5">
            <LabIcon name="flask" className="h-4 w-4 text-accent" />
            <span className="text-[11px] text-muted-foreground">비교 가능한 실험</span>
            <span className="font-mono text-lg font-medium text-foreground">
              {String(availableCount).padStart(2, "0")}
            </span>
          </div>
        </div>
        <nav aria-label="카탈로그 섹션" className="flex flex-wrap gap-2 border-b border-border pb-5">
          {visibleSections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-white px-3.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/30 hover:bg-accent-subtle hover:text-accent"
            >
              {section.title}
              <span className="font-mono text-[10px] text-subtle-foreground">{section.features.length}</span>
            </a>
          ))}
        </nav>
      </header>

      <div className="space-y-9">
        {visibleSections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id={`${section.id}-title`} className="text-[17px] font-semibold tracking-tight text-foreground">
                {section.title}
              </h2>
              <p className="text-xs text-muted-foreground">{section.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-[1500px]:grid-cols-3">
              {section.features.map((feature) => {
                const available = feature.status === "available" && Boolean(feature.href);
                const className = `group flex min-w-0 flex-col rounded-xl border p-5 transition-colors ${
                  available
                    ? "border-border bg-white hover:border-accent/40"
                    : "border-dashed border-border bg-surface"
                }`;
                const content = (
                  <>
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                      <span className={`rounded-md px-2 py-1 font-mono text-[10px] ${available ? "bg-accent-subtle text-accent" : "bg-surface-elevated text-muted-foreground"}`}>
                        {feature.badge}
                      </span>
                      <span className={`flex items-center gap-1.5 text-[10px] font-medium ${available ? "text-accent" : "text-subtle-foreground"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-accent" : "bg-slate-400"}`} />
                        {available ? "실행 가능" : "준비 중"}
                      </span>
                    </div>
                    <h3 className="text-[16px] font-semibold leading-snug tracking-tight text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 mb-5 text-[13px] leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                      <span className="font-mono text-[10px] text-subtle-foreground">{feature.since}</span>
                      {available && (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-accent">
                          비교 열기<LabIcon name="arrow-right" className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </>
                );

                return available && feature.href ? (
                  <Link key={feature.id} href={feature.href} className={className}>
                    {content}
                  </Link>
                ) : (
                  <article key={feature.id} className={className}>
                    {content}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
