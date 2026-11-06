export type SurveySelection =
  | { type: "radio" }
  | { type: "checkbox"; minSelections?: number; maxSelections: number };

// UI-only metadata travels with the draft across tabs; DB RLS determines authorization.
export type SurveyDraft = { optionIds: string[]; reason: string; ownerId?: string; dirty?: boolean };

export function restoreSurveyDraft(draft: SurveyDraft, saved: SurveyDraft | null, userId: string | null): SurveyDraft {
  if (draft.dirty && (!draft.ownerId || draft.ownerId === userId)) return { ...draft, ownerId: userId ?? undefined };
  return saved ?? { optionIds: [], reason: "" };
}

export function sameSurveyAnswer(left: SurveyDraft, right: SurveyDraft) {
  return left.reason.trim() === right.reason.trim()
    && left.optionIds.length === right.optionIds.length
    && left.optionIds.every((id) => right.optionIds.includes(id));
}

export function getSurveySelectionState(selection: SurveySelection, optionIds: readonly string[], draftIds: readonly string[]) {
  const available = new Set(optionIds);
  const minimum = selection.type === "radio" ? 1 : (selection.minSelections ?? 1);
  const maximum = selection.type === "radio" ? 1 : selection.maxSelections;
  if (available.size !== optionIds.length || optionIds.some((id) => !id)) {
    throw new Error("설문 선택지에는 중복되지 않는 ID가 필요합니다.");
  }
  if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum < 1 || minimum > maximum || maximum > available.size) {
    throw new Error("설문 선택 개수는 1 ≤ 최소 ≤ 최대 ≤ 선택지 수여야 합니다.");
  }
  const selectedIds = [...new Set(draftIds)].filter((id) => available.has(id));
  const count = selectedIds.length;
  return { selectedIds, count, minimum, maximum, canComplete: count >= minimum && count <= maximum, atLimit: count >= maximum };
}
