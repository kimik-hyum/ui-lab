"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type CatalogCategory = {
  id: string;
  title: string;
  cards: ReactNode[];
};

export function FeatureCatalogFilter({ categories }: { categories: CatalogCategory[] }) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const cards = categories
    .filter((category) => categoryId === null || category.id === categoryId)
    .flatMap((category) => category.cards);
  const filters = [
    { id: null, title: "전체", count: categories.reduce((count, category) => count + category.cards.length, 0) },
    ...categories.map((category) => ({ id: category.id, title: category.title, count: category.cards.length })),
  ];

  return (
    <div className="space-y-6">
      <div role="group" aria-label="실험실 분류" className="flex flex-wrap gap-2 border-b border-border pb-5">
        {filters.map((filter) => {
          const selected = categoryId === filter.id;
          return (
            <Button
              key={filter.id ?? "all"}
              type="button"
              variant="outline"
              aria-pressed={selected}
              aria-controls="experiment-cards"
              onClick={() => setCategoryId(filter.id)}
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
      <p role="status" className="sr-only">
        {filters.find((filter) => filter.id === categoryId)?.title} 실험 {cards.length}개
      </p>
      <div id="experiment-cards" className="flex flex-wrap items-start gap-4">
        {cards.length > 0 ? cards : <p className="text-sm text-muted-foreground">등록된 실험이 없습니다.</p>}
      </div>
    </div>
  );
}
