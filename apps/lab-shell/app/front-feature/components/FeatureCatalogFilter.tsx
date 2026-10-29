"use client";

import { forwardRef, useId, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";

type CatalogCategory = {
  id: string;
  title: string;
  subtitle: string;
  cards: { id: string; content: ReactNode }[];
};

const AnimatedCatalogCard = forwardRef<HTMLDivElement, {
  children: ReactNode;
  className: string;
  reduceMotion: boolean;
}>(function AnimatedCatalogCard({ children, className, reduceMotion }, ref) {
  const isPresent = useIsPresent();
  return (
    <motion.div
      ref={ref}
      layout={reduceMotion ? false : "position"}
      initial={{ opacity: 0, scale: reduceMotion ? 1 : 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        scale: reduceMotion ? 1 : 0,
        transition: reduceMotion ? { duration: 0 } : {
          scale: { type: "tween", duration: 0.24, ease: [0.4, 0, 1, 1] },
          opacity: { duration: 0.14, delay: 0.1 },
        },
      }}
      transition={reduceMotion ? { duration: 0 } : {
        layout: { type: "spring", stiffness: 400, damping: 36 },
        opacity: { duration: 0.18 },
        scale: { type: "spring", stiffness: 380, damping: 30, mass: 0.8 },
      }}
      inert={!isPresent}
      aria-hidden={!isPresent || undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
});

export function FeatureCatalogFilter({ categories, purpose = "experiment" }: {
  categories: CatalogCategory[];
  purpose?: "comparison" | "experiment";
}) {
  const searchParams = useSearchParams();
  const cardsId = useId();
  const reduceMotion = Boolean(useReducedMotion());
  const isExperiment = purpose === "experiment";
  const itemLabel = isExperiment ? "실험" : "비교";
  const selectedCategory = categories.find((category) => category.id === searchParams.get("category"));
  const categoryId = selectedCategory?.id ?? null;
  const cards = categories
    .filter((category) => categoryId === null || category.id === categoryId)
    .flatMap((category) => category.cards);
  const filters = [
    { id: null, title: "전체", count: categories.reduce((count, category) => count + category.cards.length, 0) },
    ...categories.map((category) => ({ id: category.id, title: category.title, count: category.cards.length })),
  ];

  function selectCategory(id: string | null) {
    const url = new URL(window.location.href);
    if (id === null) url.searchParams.delete("category");
    else url.searchParams.set("category", id);

    // Next.js synchronizes native history changes without fetching the page again.
    if (url.href !== window.location.href) window.history.pushState(null, "", url);
  }

  return (
    <div className="space-y-6">
      <div role="group" aria-label={isExperiment ? "실험실 분류" : "기능 비교 필터"} className="flex flex-wrap gap-2 border-b border-border pb-5">
        {filters.map((filter) => {
          const selected = categoryId === filter.id;
          return (
            <Button
              key={filter.id ?? "all"}
              type="button"
              variant="outline"
              aria-pressed={selected}
              aria-controls={cardsId}
              onClick={() => selectCategory(filter.id)}
              className={`h-10 gap-2 rounded-lg px-3.5 text-xs ${
                selected
                  ? "border-primary bg-primary text-white hover:bg-primary-hover hover:text-white"
                  : "bg-white text-muted-foreground hover:border-primary/30 hover:bg-primary-subtle hover:text-primary"
              }`}
            >
              {filter.title}
              <span aria-hidden="true" className={`font-mono text-[10px] ${selected ? "text-white/80" : "text-subtle-foreground"}`}>
                {filter.count}
              </span>
            </Button>
          );
        })}
      </div>
      <div className={isExperiment ? "sr-only" : "flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted-foreground"}>
        <p>{selectedCategory?.subtitle ?? "분류를 선택해 원하는 구현을 비교해 보세요."}</p>
        <p role="status" aria-atomic="true">{selectedCategory?.title ?? "전체"} · {itemLabel} {cards.length}개</p>
      </div>
      <div id={cardsId} className={`relative flex flex-wrap gap-4 ${isExperiment ? "items-start" : "items-stretch"}`}>
        <AnimatePresence initial={false} mode="popLayout">
          {cards.map((card) => (
            <AnimatedCatalogCard
              key={card.id}
              reduceMotion={reduceMotion}
              className={`min-w-0 basis-full md:basis-[calc((100%-1rem)/2)] ${isExperiment ? "grow 2xl:basis-[calc((100%-3rem)/4)]" : "2xl:basis-[calc((100%-2rem)/3)]"}`}
            >
              {card.content}
            </AnimatedCatalogCard>
          ))}
        </AnimatePresence>
        {cards.length === 0 && <p className="text-sm text-muted-foreground">등록된 {itemLabel} 항목이 없습니다.</p>}
      </div>
    </div>
  );
}
