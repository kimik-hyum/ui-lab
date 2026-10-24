import type { ReadPattern, TeamId } from "./types";

// [cmp:argument-key:start]
export function teamIds(pattern: ReadPattern): TeamId[] {
  return pattern === "mixed" ? ["alpha", "alpha", "beta"] : ["alpha", "alpha", "alpha"];
}
// [cmp:argument-key:end]

export function parsePattern(value: string | string[] | undefined): ReadPattern {
  return value === "mixed" ? "mixed" : "same";
}
