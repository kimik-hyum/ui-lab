import { readTeam } from "../read-team.server";
import { teamIds } from "../config";
import type { ReadPattern } from "../types";
import { ReadResults } from "./ReadResults";

export async function DirectTeamReads({ pattern }: { pattern: ReadPattern }) {
  // [cmp:argument-key:start]
  const ids = teamIds(pattern);
  // [cmp:argument-key:end]
  // [cmp:shared-function:start]
  const records = await Promise.all(ids.map((id) => readTeam(id)));
  // [cmp:shared-function:end]
  return <ReadResults mode="direct" pattern={pattern} records={records} />;
}
