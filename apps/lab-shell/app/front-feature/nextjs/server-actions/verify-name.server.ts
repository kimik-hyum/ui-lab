// [cmp:server-validation:start]
import "server-only";
import { randomUUID } from "node:crypto";
import { setTimeout as wait } from "node:timers/promises";
import type { VerificationState } from "./types";

export async function verifyName(value: unknown): Promise<VerificationState> {
  // 800ms는 대기 상태 관찰용이며 성능 측정값이 아닙니다.
  await wait(800);
  const input = typeof value === "string" ? value : "";
  const normalizedName = input.trim().replace(/\s+/g, " ");
  if (typeof value !== "string" || input.length > 120 || [...normalizedName].length < 2 || [...normalizedName].length > 30) {
    return {
      status: "error", input: input.slice(0, 120), errorType: "validation",
      message: "이름은 공백을 정리한 뒤 2~30자로 입력해주세요.",
      normalizedName: null, receipt: null, via: null,
    };
  }
  return {
    status: "success", input: "", errorType: null,
    message: "서버 검증을 마쳤습니다. 입력란을 비웠어요.",
    normalizedName, receipt: randomUUID(), via: null,
  };
}
// [cmp:server-validation:end]
