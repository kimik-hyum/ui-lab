import { FRAMEWORK_IDS, type DashboardDelay, type DashboardTeam, type FrameworkId } from "./_lib/types";
import { SOURCE_SCOPE_IDS, type SourceScopeId } from "./source-catalog";

export type DashboardConditions = {
  left: FrameworkId;
  right: FrameworkId;
  team: DashboardTeam;
  delayMs: DashboardDelay;
  scope: SourceScopeId;
};

export const DEFAULT_DASHBOARD_CONDITIONS: DashboardConditions = Object.freeze({
  left: "next",
  right: "sveltekit",
  team: "alpha",
  delayMs: 400,
  scope: "entry",
});

const TEAMS = ["alpha", "empty", "missing"] as const satisfies readonly DashboardTeam[];
const DELAYS = [0, 400, 800] as const satisfies readonly DashboardDelay[];

function readAllowed<T extends string | number>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const values = params.getAll(key);
  if (values.length !== 1) return fallback;
  return allowed.find((value) => String(value) === values[0]) ?? fallback;
}

export function parseDashboardConditions(params: URLSearchParams): DashboardConditions {
  const defaults = DEFAULT_DASHBOARD_CONDITIONS;
  const left = readAllowed(params, "left", FRAMEWORK_IDS, defaults.left);
  const requestedRight = readAllowed(params, "right", FRAMEWORK_IDS, defaults.right);
  const right = requestedRight === left
    ? (left === defaults.right ? defaults.left : defaults.right)
    : requestedRight;

  return {
    left,
    right,
    team: readAllowed(params, "team", TEAMS, defaults.team),
    delayMs: readAllowed(params, "delay", DELAYS, defaults.delayMs),
    scope: readAllowed(params, "scope", SOURCE_SCOPE_IDS, defaults.scope),
  };
}

export function serializeDashboardConditions(value: DashboardConditions): string {
  const normalized = parseDashboardConditions(new URLSearchParams({
    left: value.left,
    right: value.right,
    team: value.team,
    delay: String(value.delayMs),
    scope: value.scope,
  }));
  return new URLSearchParams({
    left: normalized.left,
    right: normalized.right,
    team: normalized.team,
    delay: String(normalized.delayMs),
    scope: normalized.scope,
  }).toString();
}
