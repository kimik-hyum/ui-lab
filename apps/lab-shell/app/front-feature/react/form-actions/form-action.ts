export interface ProfileResult {
  status: "idle" | "success" | "error";
  message: string;
  input: string;
  savedName: string;
  attempts: number;
}

export const INITIAL_RESULT: ProfileResult = {
  status: "idle",
  message: "이름을 입력하고 저장해보세요.",
  input: "",
  savedName: "아직 없음",
  attempts: 0,
};

// 실제 서비스에 쓰지 않는 결정적 로컬 fixture. 800ms는 관찰을 위한 지연입니다.
export async function saveProfile(
  previous: ProfileResult,
  formData: FormData,
): Promise<ProfileResult> {
  // [cmp:form-reset:start]
  const rawInput = String(formData.get("displayName") ?? "");
  const validatedName = rawInput.trim();
  // [cmp:form-reset:end]
  const shouldFail = formData.get("shouldFail") === "true";
  await new Promise<void>((resolve) => setTimeout(resolve, 800));

  const attempts = previous.attempts + 1;
  // [cmp:form-reset:start]
  if (validatedName.length < 2 || validatedName.length > 30) {
    return { ...previous, attempts, status: "error", input: rawInput, message: "이름은 2~30자로 입력해주세요." };
  }
  if (shouldFail) {
    return { ...previous, attempts, status: "error", input: rawInput, message: "실패 모드입니다. 옵션을 끄고 다시 저장해주세요." };
  }
  return {
    status: "success",
    message: `‘${validatedName}’ 저장 완료. 입력란을 비웠어요.`,
    input: "",
    savedName: validatedName,
    attempts,
  };
  // [cmp:form-reset:end]
}
