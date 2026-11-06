import type { SurveyDraft } from "../components/survey-selection";

export const SURVEY_AUTH_STORAGE_KEY = "ui-lab:survey-auth:v1";
export const DEFAULT_SURVEY_PATH = "/void-ui/responsive-tables";
const MAX_AGE = 30 * 60 * 1000;

export type SurveyAuthIntent = {
  surveyId: string;
  draft: SurveyDraft;
  returnTo: string;
  createdAt: number;
  status: "pending" | "ready" | "error";
  message?: string;
};

export function safeSurveyReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/void-ui/") || /[\\\u0000-\u001f]/.test(value)) return DEFAULT_SURVEY_PATH;
  const url = new URL(value, "https://ui-lab.invalid");
  if (url.origin !== "https://ui-lab.invalid" || !url.pathname.startsWith("/void-ui/")) return DEFAULT_SURVEY_PATH;
  return `${url.pathname}${url.search}${url.hash}`;
}

export function parseSurveyAuthIntent(raw: string | null, now = Date.now()): SurveyAuthIntent | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as SurveyAuthIntent;
    if (!value || typeof value.surveyId !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value.surveyId)
      || !Number.isFinite(value.createdAt) || now - value.createdAt > MAX_AGE || value.createdAt > now
      || !["pending", "ready", "error"].includes(value.status)
      || !value.draft || typeof value.draft.reason !== "string" || value.draft.reason.length > 300
      || !Array.isArray(value.draft.optionIds) || value.draft.optionIds.length === 0
      || value.draft.optionIds.some((id) => typeof id !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id))
      || new Set(value.draft.optionIds).size !== value.draft.optionIds.length) return null;
    return { ...value, returnTo: safeSurveyReturnPath(value.returnTo), message: typeof value.message === "string" ? value.message : undefined };
  } catch { return null; }
}

export function surveyErrorMessage(error: { message?: string; code?: string } | null): string {
  if (error?.code === "42501" || error?.code === "PGRST301" || error?.code === "PGRST303") return "로그인이 만료됐어요. 다시 로그인하면 작성한 의견을 제출할 수 있습니다.";
  const messages: Record<string, string> = {
    survey_not_open: "지금은 응답을 받지 않는 설문입니다. 작성한 내용은 유지됩니다.",
    survey_selection_count_invalid: "선택 개수가 설문 조건과 다릅니다. 선택 항목을 다시 확인해주세요.",
    survey_selection_invalid: "선택 항목을 다시 확인해주세요.",
    survey_option_unavailable: "선택지 구성이 변경됐어요. 페이지를 새로고침한 뒤 다시 선택해주세요.",
    survey_reason_too_long: "선택 사유는 300자까지 입력할 수 있어요.",
  };
  return messages[error?.message ?? ""] ?? "연결을 완료하지 못했어요. 작성한 내용은 유지되니 잠시 후 다시 시도해주세요.";
}

// Network/rate-limit/server errors must not turn a valid session into a logged-out UI.
export function isSurveySessionExpired(error: { status?: number; code?: string; name?: string } | null): boolean {
  return error?.status === 401 || error?.status === 403 || error?.name === "AuthSessionMissingError"
    || ["session_not_found", "user_not_found", "bad_jwt", "refresh_token_not_found", "refresh_token_already_used"].includes(error?.code ?? "");
}
