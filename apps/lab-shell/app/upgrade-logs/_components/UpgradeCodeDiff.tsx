"use client";

import dynamic from "next/dynamic";
import { useId, useState } from "react";
import type { FileDiff } from "../_lib/code-diff";

const UpgradeFileDiff = dynamic(() => import("./UpgradeFileDiff"), {
  loading: () => <p className="p-5 text-xs text-slate-500">코드를 불러오는 중…</p>,
});

export default function UpgradeCodeDiff({ files }: { files: FileDiff[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(files[0].path);
  const selectId = useId();
  const file = files.find((item) => item.path === selected) ?? files[0];

  return (
    <details className="mt-3" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer px-5 py-3 text-xs font-medium text-violet-700 hover:bg-violet-50/50">
        코드 비교 <span className="ml-2 font-normal text-slate-500">{files.length}개 파일 · 변경 줄 강조</span>
      </summary>
      {open && <div className="border-y border-slate-200 bg-slate-50/60">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <label htmlFor={selectId} className="text-xs font-medium text-slate-600">파일</label>
          <select id={selectId} value={file.path} onChange={(event) => setSelected(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-700 focus:outline-2 focus:outline-violet-500">
            {files.map((item) => <option key={item.path} value={item.path}>{item.path}</option>)}
          </select>
          <span aria-label={`삭제 ${file.removed}줄`} className="font-mono text-xs font-semibold text-red-600">−{file.removed}</span>
          <span aria-label={`추가 ${file.added}줄`} className="font-mono text-xs font-semibold text-blue-600">+{file.added}</span>
        </div>
        <UpgradeFileDiff key={file.path} file={file} />
        <p className="px-5 pb-4 text-[11px] leading-5 text-slate-500">원본 위치는 각 블록 제목에 표시됩니다. 줄 번호는 발췌 코드 기준이며, 변경 줄에 마우스를 올리면 대응 구간이 함께 강조됩니다.</p>
      </div>}
    </details>
  );
}
