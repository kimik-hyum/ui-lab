'use client';

import { useState } from "react";

interface PageNumberInputProps {
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  onNavigate: (page: number) => void;
}

// 부모에서 key={currentPage}를 지정해 페이지가 바뀌면 입력 초안을 초기화합니다.
export function PageNumberInput({ currentPage, totalPages, isLoading, onNavigate }: PageNumberInputProps) {
  const [draft, setDraft] = useState(String(currentPage));

  const commit = () => {
    const page = Number(draft);
    if (!Number.isInteger(page) || page < 1 || page > totalPages) {
      setDraft(String(currentPage));
      return;
    }
    if (!isLoading && page !== currentPage) onNavigate(page);
  };

  return (
    <input
      type="number"
      min={1}
      max={totalPages}
      step={1}
      inputMode="numeric"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      disabled={isLoading}
      className="w-14 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-right font-semibold text-white focus:border-cyan-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="현재 페이지 입력"
    />
  );
}
