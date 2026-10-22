export type TeamId = "alpha" | "beta";
export type ReadPattern = "same" | "mixed";
export type ReadMode = "direct" | "cached";
export type TeamRead = { team: TeamId; name: string; tasks: number; executionId: string };
