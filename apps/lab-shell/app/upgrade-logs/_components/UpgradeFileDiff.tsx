"use client";

import { useState } from "react";
import { ComparisonCodeBlock } from "../../front-feature/components/ComparisonCodeBlock";
import type { FileDiff } from "../_lib/code-diff";
import { formatCodeRange } from "../_lib/format";

export default function UpgradeFileDiff({ file }: { file: FileDiff }) {
  const [active, setActive] = useState<{ excerpt: number; group: number } | null>(null);
  return (
    <div className="space-y-5 px-3 pb-4 sm:px-5" data-file-diff={file.path}>
      {file.excerpts.map((excerpt, index) => {
        const group = active?.excerpt === index ? excerpt.groups[active.group] : null;
        const onHover = (side: "before" | "after", line: number | null) => {
          const group = line === null ? -1 : excerpt.groups.findIndex((item) => item[side].includes(line));
          setActive(group < 0 ? null : { excerpt: index, group });
        };
        return <div key={index}>
          {file.excerpts.length > 1 && <p className="mb-2 text-[11px] text-slate-400">변경 구간 {index + 1} / {file.excerpts.length}</p>}
          <div className="grid items-stretch gap-3 xl:grid-cols-2" data-diff-excerpt={index}>
            <div className="min-w-0 [&>div]:max-h-[28rem] [&>div>div:last-child]:min-h-0" data-diff-side="before">
              {excerpt.before ? <ComparisonCodeBlock
                code={excerpt.before.code}
                title={`변경 전 · ${formatCodeRange(excerpt.before)}`}
                badge={`−${excerpt.removedLines.length}`}
                color="red"
                highlightedLines={group?.before ?? excerpt.removedLines}
                interactiveLines={excerpt.removedLines}
                onLineHover={(line) => onHover("before", line)}
              /> : <div className="grid h-full min-h-28 place-items-center rounded-xl border border-dashed border-slate-300 p-8 text-xs text-slate-500">새 파일 · 이전 코드 없음</div>}
            </div>
            <div className="min-w-0 [&>div]:max-h-[28rem] [&>div>div:last-child]:min-h-0" data-diff-side="after">
              {excerpt.after ? <ComparisonCodeBlock
                code={excerpt.after.code}
                title={`변경 후 · ${formatCodeRange(excerpt.after)}`}
                badge={`+${excerpt.addedLines.length}`}
                color="blue"
                highlightedLines={group?.after ?? excerpt.addedLines}
                interactiveLines={excerpt.addedLines}
                onLineHover={(line) => onHover("after", line)}
              /> : <div className="grid h-full min-h-28 place-items-center rounded-xl border border-dashed border-slate-300 p-8 text-xs text-slate-500">삭제된 파일 · 이후 코드 없음</div>}
            </div>
          </div>
        </div>;
      })}
    </div>
  );
}
