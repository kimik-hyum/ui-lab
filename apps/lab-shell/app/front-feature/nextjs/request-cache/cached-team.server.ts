import "server-only";
// [cmp:shared-function:start]
import { cache } from "react";
import { readTeam } from "./read-team.server";

// 같은 memoized 함수를 모든 호출에서 사용합니다. 컴포넌트 안에서 다시 만들지 않습니다.
export const readCachedTeam = cache(readTeam);
// [cmp:shared-function:end]
