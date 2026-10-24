import { readCachedTeam } from "../cached-team.server";
import { teamIds } from "../config";
import type { ReadPattern } from "../types";
import { ReadResults } from "./ReadResults";

export async function CachedTeamReads({ pattern }: { pattern: ReadPattern }) {
  // [cmp:argument-key:start]
  const ids = teamIds(pattern);
  // [cmp:argument-key:end]
  // [cmp:shared-function:start]
  const records = await Promise.all(ids.map((id) => readCachedTeam(id)));
  // [cmp:shared-function:end]
  return <ReadResults mode="cached" pattern={pattern} records={records} />;
}
