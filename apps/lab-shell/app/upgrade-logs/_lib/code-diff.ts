import { diffLines } from "diff";
import type { CodeExcerpt, FileCodeChange } from "./types";

export type ChangedLineGroup = { before: number[]; after: number[] };
export type ExcerptDiff = CodeExcerpt & {
  groups: ChangedLineGroup[];
  removedLines: number[];
  addedLines: number[];
};
export type FileDiff = {
  path: string;
  excerpts: ExcerptDiff[];
  removed: number;
  added: number;
};

// Diff frozen excerpts on the server; the browser only handles selection and hover.
export function buildFileDiff(file: FileCodeChange): FileDiff {
  const excerpts = file.excerpts.map((excerpt): ExcerptDiff => {
    const groups: ChangedLineGroup[] = [];
    let current: ChangedLineGroup | null = null;
    let beforeLine = 1;
    let afterLine = 1;

    for (const part of diffLines(excerpt.before?.code ?? "", excerpt.after?.code ?? "", {
      stripTrailingCr: true,
      ignoreNewlineAtEof: true,
    })) {
      if (!part.added && !part.removed) {
        beforeLine += part.count;
        afterLine += part.count;
        current = null;
        continue;
      }
      if (!current) {
        current = { before: [], after: [] };
        groups.push(current);
      }
      for (let index = 0; index < part.count; index += 1) {
        if (part.removed) current.before.push(beforeLine++);
        else current.after.push(afterLine++);
      }
    }
    return {
      ...excerpt,
      groups,
      removedLines: groups.flatMap((group) => group.before),
      addedLines: groups.flatMap((group) => group.after),
    };
  });
  return {
    path: file.path,
    excerpts,
    removed: excerpts.reduce((count, excerpt) => count + excerpt.removedLines.length, 0),
    added: excerpts.reduce((count, excerpt) => count + excerpt.addedLines.length, 0),
  };
}
