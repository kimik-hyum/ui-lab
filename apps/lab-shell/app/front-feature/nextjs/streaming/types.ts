export type DashboardMode = "blocking" | "streaming";

export type DashboardDelay = {
  summaryMs: number;
  activityMs: number;
};

export type DashboardSummary = {
  label: string;
  value: string;
  caption: string;
}[];

export type DashboardActivity = {
  id: string;
  project: string;
  title: string;
  status: string;
}[];

export type StreamingComparisonProps = {
  blockingCode: string;
  streamingCode: string;
};
