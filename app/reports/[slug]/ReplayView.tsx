"use client";

import { useState } from "react";
import type { ParsedReport, ReportItem } from "../utils/parseFrontmatter";

// 기술 ID → 데모 페이지 매핑
const DEMO_LINK_MAP: Record<string, string> = {
  react: "/front-feature/react",
  nextjs: "/front-feature/nextjs",
  "rsc-vs-csc": "/front-feature/nextjs/rsc-vs-csc",
  optimistic: "/front-feature/react/optimistic",
  activity: "/front-feature/react/activity",
};

const VERDICT_LABEL: Record<string, string> = {
  adopt: "도입 권장",
  watch: "관찰 대상",
  skip: "스킵",
};

const VERDICT_COLOR: Record<string, string> = {
  adopt: "text-emerald-400 border-emerald-900/50 bg-emerald-950/30",
  watch: "text-amber-400 border-amber-900/50 bg-amber-950/30",
  skip: "text-zinc-500 border-zinc-800 bg-zinc-900/30",
};

const VERDICT_EMOJI: Record<string, string> = {
  adopt: "✅",
  watch: "👀",
  skip: "⏭",
};

export function ReplayView({ report }: { report: ParsedReport }) {
  const { frontmatter: fm, sections } = report;
  const [activeVerdict, setActiveVerdict] = useState<string | null>(null);

  const filteredSections = activeVerdict
    ? sections.filter((s) => s.verdict === activeVerdict)
    : sections;

  return (
    <div className="flex h-screen flex-col bg-black text-zinc-200">
      {/* 상단 배너 */}
      <div className="shrink-0 border-b border-zinc-800 bg-zinc-950 px-6 py-3 flex items-center gap-3">
        <span className="text-[10px] rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-500 uppercase tracking-wider">
          Replay Mode
        </span>
        <p className="text-xs text-zinc-500">
          이 리포트는 <span className="text-zinc-300">로컬 환경</span>에서{" "}
          <span className="text-zinc-300">{fm.model}</span> + Web Search로 생성됐습니다.
          실제 AI 분석은 로컬에서만 실행됩니다.
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── 왼쪽: Scout UI (disabled 상태) ── */}
        <aside className="w-64 shrink-0 border-r border-zinc-800 flex flex-col bg-zinc-950/60">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              분석 대상
            </h2>
            <div className="flex flex-col gap-1.5">
              {fm.selected.map((chip) => {
                const demoHref = DEMO_LINK_MAP[chip.id];
                return (
                  <div
                    key={chip.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2"
                  >
                    <div>
                      <span className="text-xs font-medium text-zinc-200">{chip.label}</span>
                      <span className="ml-1.5 text-[10px] text-zinc-500">{chip.version}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-zinc-600 bg-zinc-900 rounded px-1 py-0.5">
                        {chip.category}
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="선택됨" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 비활성 버튼들 */}
          <div className="p-4 flex flex-col gap-2">
            <div className="relative">
              <button
                disabled
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-600 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>🔍</span> 수집하기
              </button>
              <span className="absolute -top-2 right-2 text-[9px] bg-zinc-800 text-zinc-500 rounded px-1">
                로컬 전용
              </span>
            </div>
            <div className="relative">
              <button
                disabled
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-600 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>✔</span> 검증하기
              </button>
              <span className="absolute -top-2 right-2 text-[9px] bg-zinc-800 text-zinc-500 rounded px-1">
                로컬 전용
              </span>
            </div>
            <div className="relative">
              <button
                disabled
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-600 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>↓</span> MD 내보내기
              </button>
              <span className="absolute -top-2 right-2 text-[9px] bg-zinc-800 text-zinc-500 rounded px-1">
                로컬 전용
              </span>
            </div>
          </div>

          {/* 판정 필터 */}
          <div className="p-4 border-t border-zinc-800 mt-auto">
            <p className="text-[10px] text-zinc-600 mb-2 uppercase tracking-wider">판정 필터</p>
            <div className="flex flex-col gap-1">
              {[
                { key: "adopt", label: `✅ 도입 권장 ${fm.verdicts.adopt}` },
                { key: "watch", label: `👀 관찰 대상 ${fm.verdicts.watch}` },
                { key: "skip", label: `⏭ 스킵 ${fm.verdicts.skip}` },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveVerdict((prev) => (prev === key ? null : key))}
                  className={`rounded px-2 py-1 text-left text-xs transition-colors ${
                    activeVerdict === key
                      ? "bg-zinc-700 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── 오른쪽: 결과 렌더링 ── */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="mx-auto max-w-2xl space-y-4">
            {/* 헤더 */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">{fm.title}</h1>
              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                <span>{fm.date}</span>
                <span>·</span>
                <span>{fm.model} + Web Search</span>
              </div>
              <div className="mt-3 flex gap-3">
                {fm.verdicts.adopt > 0 && (
                  <span className="text-xs text-emerald-400">✅ 도입 권장 {fm.verdicts.adopt}</span>
                )}
                {fm.verdicts.watch > 0 && (
                  <span className="text-xs text-amber-400">👀 관찰 {fm.verdicts.watch}</span>
                )}
                {fm.verdicts.skip > 0 && (
                  <span className="text-xs text-zinc-500">⏭ 스킵 {fm.verdicts.skip}</span>
                )}
              </div>
            </div>

            {/* 섹션별 아이템 */}
            {filteredSections.map((section) =>
              section.items.map((item) => (
                <ItemCard
                  key={item.title}
                  item={item}
                  verdict={section.verdict}
                  selectedIds={fm.selected.map((s) => s.id)}
                />
              )),
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function ItemCard({
  item,
  verdict,
  selectedIds,
}: {
  item: ReportItem;
  verdict: string;
  selectedIds: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  // 제목에서 기술명 추출해 데모 링크 찾기
  const demoHref = Object.entries(DEMO_LINK_MAP).find(([key]) =>
    item.title.toLowerCase().includes(key.replace(/-/g, " ")),
  )?.[1] ?? null;

  return (
    <div className={`rounded-xl border p-5 ${VERDICT_COLOR[verdict] ?? "border-zinc-800"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-zinc-100">{item.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.score !== null && (
            <span className="text-[10px] text-zinc-500">{item.score}/10</span>
          )}
          <span
            className={`text-[10px] rounded-full border px-2 py-0.5 ${VERDICT_COLOR[verdict]}`}
          >
            {VERDICT_EMOJI[verdict]} {VERDICT_LABEL[verdict]}
          </span>
        </div>
      </div>

      {item.body && (
        <p className="text-sm text-zinc-400 leading-relaxed">{item.body}</p>
      )}

      {(item.adoptionPath || item.demoIdea) && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          {expanded ? "▲ 접기" : "▼ 적용 방법 · 데모 아이디어 보기"}
        </button>
      )}

      {expanded && (
        <div className="mt-3 space-y-3">
          {item.adoptionPath && (
            <div className="rounded-lg bg-zinc-900/60 p-3">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">적용 방법</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{item.adoptionPath}</p>
            </div>
          )}
          {item.demoIdea && (
            <div className="rounded-lg bg-zinc-900/60 p-3">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">💡 데모 아이디어</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{item.demoIdea}</p>
            </div>
          )}
        </div>
      )}

      {demoHref && (
        <div className="mt-3 pt-3 border-t border-zinc-800/50">
          <a
            href={demoHref}
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            → 구현된 데모 보기
          </a>
        </div>
      )}
    </div>
  );
}
