import type { VerificationState } from "./types";

export const INITIAL_VERIFICATION: VerificationState = {
  status: "idle", input: "", message: "이름을 입력하고 서버에서 확인해보세요.",
  errorType: null, normalizedName: null, receipt: null, via: null,
};

export function transportFailure(input: string, message = "서버 응답을 받지 못했습니다. 입력을 유지했으니 다시 시도해주세요."): VerificationState {
  return { status: "error", input, message, errorType: "transport", normalizedName: null, receipt: null, via: null };
}
