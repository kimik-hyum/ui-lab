export const FRAMEWORK_IDS = ["next", "react-router", "sveltekit", "nuxt"] as const;
export type FrameworkId = (typeof FRAMEWORK_IDS)[number];
export type DashboardTeam = "alpha" | "empty" | "missing";
export type DashboardDelay = 0 | 400 | 800;
export type ObserverRequest = { team: DashboardTeam; delayMs: DashboardDelay };

export type ObserverMetrics = {
  responseStartMs: number;
  firstByteMs: number | null;
  contentReadyMs: number | null;
  totalMs: number;
  /** Decoded response body bytes; not compressed network transfer bytes. */
  htmlBytes: number;
};

export type ObserverSource = {
  label: string;
  version: string;
  path: string;
  renderMode: "blocking";
};

export type ObserverErrorCode =
  | "offline" | "timeout" | "not-found" | "invalid-payload"
  | "upstream-error" | "too-large" | "aborted"
  | "invalid-target" | "invalid-request";

type ObserverBase = {
  request: ObserverRequest;
  observedAt: string;
};

export type ObserverResponse = ObserverBase & (
  | {
    ok: true;
    framework: FrameworkId;
    source: ObserverSource;
    upstreamStatus: 200;
    metrics: ObserverMetrics;
    /** Sanitized, complete main element from the server's actual HTML. */
    html: string;
    error: null;
  }
  | {
    ok: false;
    framework: FrameworkId | null;
    source: ObserverSource | null;
    upstreamStatus: number | null;
    metrics: ObserverMetrics | null;
    html: null;
    error: { code: ObserverErrorCode; message: string };
  }
);

export function isFrameworkId(value: string): value is FrameworkId {
  return FRAMEWORK_IDS.some((id) => id === value);
}

export function parseObserverRequest(params: URLSearchParams): ObserverRequest | null {
  if ([...params.keys()].some((key) => key !== "delay" && key !== "team")) return null;
  if (params.getAll("delay").length > 1 || params.getAll("team").length > 1) return null;
  const delay = params.get("delay") ?? "400";
  const team = params.get("team") ?? "alpha";
  if (!["0", "400", "800"].includes(delay) || !["alpha", "empty", "missing"].includes(team)) return null;
  return { delayMs: Number(delay) as DashboardDelay, team: team as DashboardTeam };
}
