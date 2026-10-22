"use client";

import { useState } from "react";
import Link from "next/link";
import LabIcon from "./LabIcon";
import { experiments } from "../lib/lab-navigation";

const categories = ["전체", "React", "Next.js", "UI"] as const;

export default function ExperimentExplorer() {
  const [category, setCategory] = useState<(typeof categories)[number]>("전체");
  const filtered = experiments.filter(
    (experiment) => category === "전체" || experiment.category === category,
  );
  return (
    <section
      id="experiments"
      className="scroll-mt-24"
      aria-labelledby="experiments-title"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h2
            id="experiments-title"
            className="text-[17px] font-bold tracking-tight"
          >
            실험 둘러보기
          </h2>
          <span className="rounded-md border border-border bg-white px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {String(experiments.length).padStart(2, "0")}
          </span>
        </div>
        <div
          className="flex rounded-lg border border-border bg-white p-1"
          role="group"
          aria-label="실험 카테고리"
        >
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={`min-h-8 rounded-md px-3 text-xs font-medium transition-colors ${category === item ? "bg-foreground text-white" : "text-muted-foreground hover:bg-surface"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div
        className="grid gap-4 sm:grid-cols-2 min-[1800px]:grid-cols-4"
        aria-live="polite"
      >
        {filtered.map((experiment) => (
          <Link
            key={experiment.href}
            href={experiment.href}
            className="group flex min-w-0 flex-col rounded-xl border border-border bg-white p-5 transition-colors hover:border-accent/40 hover:bg-[#fcfefd]"
          >
            <div className="mb-5 flex items-center justify-between">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${experiment.category === "React" ? "bg-sky-50 text-sky-600" : experiment.category === "Next.js" ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}`}
              >
                <LabIcon name={experiment.icon} className="h-[18px] w-[18px]" />
              </span>
              <LabIcon
                name="arrow-up-right"
                className="h-4 w-4 text-slate-400 transition-colors group-hover:text-accent"
              />
            </div>
            <h3 className="text-[15px] font-semibold tracking-[-0.25px] text-foreground">
              {experiment.title}
            </h3>
            <p className="mb-5 mt-2 text-[12px] leading-[1.8] text-muted-foreground">
              {experiment.description}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border/75 pt-3">
              <span className="rounded bg-surface px-2 py-1 font-mono text-[10px] text-muted-foreground">
                {experiment.tag}
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] text-accent">
                <span className="h-1 w-1 rounded-full bg-accent" />
                실행 가능
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
