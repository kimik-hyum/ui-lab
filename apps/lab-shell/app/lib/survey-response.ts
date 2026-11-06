import type { SupabaseClient } from "@supabase/supabase-js";
import type { SurveyDraft } from "../components/survey-selection";

export type SurveyResponse = {
  id: string;
  draft: SurveyDraft;
  submittedAt: string | null;
  updatedAt: string | null;
};

type ResponseRow = {
  id: string;
  reason: string;
  submitted_at: string;
  updated_at: string;
  options: { option: { option_key: string } | null }[];
};

export const SURVEY_READ_ERROR = "이전에 제출한 응답을 불러오지 못했어요. 다시 불러와주세요.";

export async function fetchSurveyResponse(client: SupabaseClient, surveyId: string, userId: string, signal?: AbortSignal): Promise<SurveyResponse | null> {
  // PostgREST sends a GET. Explicit filters narrow the query; RLS enforces ownership.
  const { data, error } = await client.from("survey_responses")
    .select("id,reason,submitted_at,updated_at,surveys!inner(survey_key),options:response_options(option:survey_options(option_key))")
    .eq("surveys.survey_key", surveyId)
    .eq("user_id", userId)
    .abortSignal(signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000))
    .maybeSingle<ResponseRow>();
  if (error) throw new Error(SURVEY_READ_ERROR);
  if (!data) return null;
  const optionIds = data.options.map(({ option }) => option?.option_key);
  if (!optionIds.length || optionIds.some((id) => !id)) throw new Error(SURVEY_READ_ERROR);
  return {
    id: data.id,
    draft: { optionIds: optionIds as string[], reason: data.reason, ownerId: userId },
    submittedAt: data.submitted_at,
    updatedAt: data.updated_at,
  };
}
