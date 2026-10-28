import LabIcon from "../../components/LabIcon";
import { FeatureCatalogCard } from "./FeatureCatalogCard";
import { FeatureCatalogFilter } from "./FeatureCatalogFilter";
import type { FeatureCatalogSection } from "./FeatureCatalogTypes";

interface FeatureCatalogProps {
  title: string;
  description: string;
  sections: FeatureCatalogSection[];
  purpose?: "comparison" | "experiment";
}

export function FeatureCatalog({ title, description, sections, purpose = "comparison" }: FeatureCatalogProps) {
  const isExperiment = purpose === "experiment";
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
            <p className="mb-2 font-mono text-[10px] font-medium tracking-[0.15em] text-primary">
              {isExperiment ? "IDEA LAB" : "FEATURE COMPARISONS"}
            </p>
            <h1 className="text-[28px] font-bold tracking-[-0.9px] sm:text-[31px]">
              {title}<span className="ml-2 text-primary">.</span>
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-white px-4 py-2.5">
            <LabIcon name={isExperiment ? "flask" : "code"} className="h-4 w-4 text-primary" />
            <span className="text-[11px] text-muted-foreground">{isExperiment ? "아이디어 구현" : "코드 비교"}</span>
            <span className="font-mono text-lg font-medium text-foreground">
              {String(availableCount).padStart(2, "0")}
            </span>
          </div>
        </div>
      </header>

      <FeatureCatalogFilter
        key={title}
        purpose={purpose}
        categories={visibleSections.map((section) => ({
          id: section.id,
          title: section.title,
          subtitle: section.subtitle,
          cards: section.features.map((feature) => ({
            id: `${section.id}:${feature.id}`,
            content: <FeatureCatalogCard feature={feature} purpose={purpose} />,
          })),
        }))}
      />
    </main>
  );
}

export type { FeatureCatalogItem, FeatureCatalogSection } from "./FeatureCatalogTypes";
