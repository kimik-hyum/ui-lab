"use client";

import { useState } from "react";
import Link from "next/link";
import type { ParsedReport, ReportItem } from "../utils/parseFrontmatter";

const VERDICT_CONFIG = {
  adopt: {
    emoji: "✅", label: "도입 권장",
    cardBorder: "border-slate-200 border-l-[3px] border-l-emerald-400",
    badgeBorder: "border-emerald-200 bg-emerald-50",
    text: "text-emerald-700",
  },
  watch: {
    emoji: "👀", label: "관찰 대상",
    cardBorder: "border-slate-200 border-l-[3px] border-l-amber-400",
    badgeBorder: "border-amber-200 bg-amber-50",
    text: "text-amber-700",
  },
  skip: {
    emoji: "⏭", label: "스킵",
    cardBorder: "border-slate-200 border-l-[3px] border-l-slate-300",
    badgeBorder: "border-slate-200 bg-slate-50",
    text: "text-slate-400",
  },
};

// ─── 점수 바 ──────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="w-12 h-1 rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-violet-400"
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
      <span className="text-xs text-slate-400">{score}</span>
    </div>
  );
}

// ─── 결과 카드 ───────────────────────────────────────────────────────────────
function ItemCard({ item }: { item: ReportItem }) {
  const [adoptionOpen, setAdoptionOpen] = useState(false);
  const cfg = VERDICT_CONFIG[item.verdict];
  const isImplemented = !!item.implementedHref;

  return (
    <div className={`rounded-xl border bg-white overflow-hidden ${cfg.cardBorder}`}>
      <div className="px-5 py-4">
        {/* 제목 + 점수 + 판정 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-slate-800 leading-snug">{item.title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            {item.score !== null && <ScoreBar score={item.score} />}
            <span className={`text-xs rounded-full border px-2 py-0.5 ${cfg.badgeBorder} ${cfg.text}`}>
              {cfg.emoji} {cfg.label}
            </span>
          </div>
        </div>

        {/* 구현 여부 배지 */}
        {isImplemented ? (
          <Link
            href={item.implementedHref!}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs text-violet-600 hover:bg-violet-100 transition-colors"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            이 사이트에 구현됨 · {item.implementedLabel} →
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            미구현
          </span>
        )}
      </div>

      {/* 본문 */}
      {item.body && (
        <div className="px-5 pb-3">
          <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
        </div>
      )}

      {/* 데모 아이디어 — 기본 노출 */}
      {item.demoIdea && (
        <div className="mx-5 mb-4 rounded-lg bg-violet-50 border border-violet-100 px-4 py-3">
          <p className="text-xs font-medium text-violet-500 mb-1">💡 데모 아이디어</p>
          <p className="text-xs text-slate-600 leading-relaxed">{item.demoIdea}</p>
        </div>
      )}

      {/* 적용 방법 — 접기 유지 */}
      {item.adoptionPath && (
        <>
          <button
            onClick={() => setAdoptionOpen((v) => !v)}
            className="w-full px-5 py-3 text-left text-xs text-slate-400 hover:text-slate-600 border-t border-slate-200/80 transition-colors flex items-center justify-between"
          >
            <span>적용 방법 {adoptionOpen ? "접기" : "보기"}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${adoptionOpen ? "rotate-180" : ""}`}
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 5l4 4 4-4" />
            </svg>
          </button>
          {adoptionOpen && (
            <div className="px-5 pb-4">
              <div className="rounded-lg bg-white p-3 border border-slate-200">
                <p className="text-xs text-slate-600 leading-relaxed">{item.adoptionPath}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
export function ReplayView({ report }: { report: ParsedReport }) {
  const { frontmatter: fm, items } = report;
  const [filter, setFilter] = useState<"all" | "adopt" | "watch" | "skip">("all");

  const implementedCount = items.filter((i) => i.implementedHref).length;
  const filteredItems = filter === "all" ? items : items.filter((i) => i.verdict === filter);

  const filterOptions = (["all", "adopt", "watch", "skip"] as const).filter((v) => {
    if (v === "all") return true;
    return items.filter((i) => i.verdict === v).length > 0;
  });

  return (
    <div>
      {/* 브레드크럼 */}
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 flex items-center gap-1.5">
        <Link href="/reports" className="text-xs text-slate-400 hover:text-violet-600 transition-colors">
          Scout Reports
        </Link>
        <span className="text-slate-300 text-xs">/</span>
        <span className="text-xs text-slate-600 truncate max-w-xs">{fm.title}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs text-violet-600 uppercase tracking-wider">
            Scout Report
          </span>
          <span className="text-xs text-slate-400 ml-1">
            <span className="text-slate-600">{fm.model}</span> + Web Search
          </span>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* 리포트 헤더 */}
        <div className="mb-8 pb-8 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs text-slate-400">{fm.date}</span>
            <span className="text-slate-200">·</span>
            <span className="text-xs text-violet-500 font-medium">{fm.model}</span>
            <span className="text-slate-200">·</span>
            <span className="text-xs text-slate-400">Web Search</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">{fm.title}</h1>

          {/* 판정 요약 */}
          <div className="flex items-center gap-4 flex-wrap">
            {fm.verdicts.adopt > 0 && (
              <span className="text-sm font-semibold text-emerald-600">✅ 도입 권장 {fm.verdicts.adopt}</span>
            )}
            {fm.verdicts.watch > 0 && (
              <span className="text-sm font-semibold text-amber-600">👀 관찰 대상 {fm.verdicts.watch}</span>
            )}
            {fm.verdicts.skip > 0 && (
              <span className="text-sm font-semibold text-slate-400">⏭ 스킵 {fm.verdicts.skip}</span>
            )}
          </div>

          {/* 분석 대상 칩 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {fm.selected.map((chip) => (
              <div
                key={chip.id}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
              >
                <span className="text-xs text-slate-600">{chip.label}</span>
                {chip.from && chip.to && (
                  <>
                    <span className="text-slate-300 text-xs">v{chip.from}</span>
                    <span className="text-slate-300 text-xs">→</span>
                    <span className="text-violet-600 text-xs font-medium">v{chip.to}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 인라인 필터 + 구현 현황 */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {filterOptions.map((v) => {
            const cfg = v !== "all" ? VERDICT_CONFIG[v] : null;
            const count = v === "all" ? items.length : items.filter((i) => i.verdict === v).length;
            return (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  filter === v
                    ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                    : `border-slate-200 ${cfg ? cfg.text : "text-slate-500"} hover:border-slate-300 hover:text-slate-700 bg-white`
                }`}
              >
                {v === "all" ? `전체 ${count}` : `${cfg!.emoji} ${cfg!.label} ${count}`}
              </button>
            );
          })}

          {/* 구현 현황 — 우측 정렬 */}
          <div className="ml-auto flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-violet-500 transition-all"
                style={{ width: `${Math.round((implementedCount / items.length) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {implementedCount}/{items.length} 구현
            </span>
          </div>
        </div>

        {/* 결과 카드 목록 */}
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <ItemCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
