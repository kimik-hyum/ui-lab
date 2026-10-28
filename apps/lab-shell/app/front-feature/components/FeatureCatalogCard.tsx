import Image from "next/image";
import Link from "next/link";
import LabIcon from "../../components/LabIcon";
import type { FeatureCatalogItem } from "./FeatureCatalogTypes";

export function FeatureCatalogCard({
  feature,
  purpose = "comparison",
}: {
  feature: FeatureCatalogItem;
  purpose?: "comparison" | "experiment";
}) {
  const isExperiment = purpose === "experiment";
  const available = feature.status === "available" && Boolean(feature.href);
  const className = `group flex w-full min-w-0 flex-col rounded-xl border p-5 transition-colors ${isExperiment ? "" : "h-full"} ${
    available
      ? "border-border bg-white hover:border-primary/40"
      : "border-dashed border-border bg-surface"
  }`;
  const content = (
    <>
      {feature.image && (
        <div className="-mx-5 -mt-5 mb-5 overflow-hidden rounded-t-xl border-b border-border bg-surface">
          <Image
            src={feature.image.src}
            alt={feature.image.alt}
            width={feature.image.width}
            height={feature.image.height}
            sizes={isExperiment ? "100vw" : "(min-width: 1500px) 30vw, (min-width: 768px) 45vw, 100vw"}
            className={isExperiment ? "h-64 w-full object-cover sm:h-80" : "h-auto w-full"}
          />
        </div>
      )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-md px-2 py-1 font-mono text-[10px] ${available ? "bg-primary-subtle text-primary" : "bg-surface-elevated text-muted-foreground"}`}>
          {feature.badge}
        </span>
        <span className={`flex items-center gap-1.5 text-[10px] font-medium ${available ? "text-primary" : "text-subtle-foreground"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-primary" : "bg-slate-400"}`} />
          {available ? "실행 가능" : "준비 중"}
        </span>
      </div>
      <h2 className="text-[16px] font-semibold leading-snug tracking-tight text-foreground">
        {feature.title}
      </h2>
      <p className="mt-2 mb-5 text-[13px] leading-relaxed text-muted-foreground">
        {feature.description}
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="font-mono text-[10px] text-subtle-foreground">{feature.since}</span>
        {available && (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
            {feature.actionLabel ?? (isExperiment ? "실험 열기" : "비교 열기")}
            <LabIcon name="arrow-right" className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </>
  );

  return available && feature.href ? (
    <Link href={feature.href} className={className}>
      {content}
    </Link>
  ) : (
    <article className={className}>{content}</article>
  );
}
