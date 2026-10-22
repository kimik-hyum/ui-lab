import "server-only";
import { randomUUID } from "node:crypto";
import type { TeamId, TeamRead } from "./types";

const TEAMS = { alpha: { name: "알파 팀", tasks: 8 }, beta: { name: "베타 팀", tasks: 3 } };

// [cmp:execution-id:start]
export async function readTeam(team: TeamId): Promise<TeamRead> {
  // 실제 함수 본문이 실행될 때 생성합니다. DB 요청이나 성능 측정은 아닙니다.
  return { team, ...TEAMS[team], executionId: randomUUID() };
}
// [cmp:execution-id:end]
