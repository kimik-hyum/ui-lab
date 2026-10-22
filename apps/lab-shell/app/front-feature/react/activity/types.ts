export type ActivityDemoKind = "css" | "activity";

export type ActivityStats = {
  setups: number;
  cleanups: number;
  ticks: number;
};

export type ActivityEvent = { type: "setup" | "cleanup" | "tick" };
