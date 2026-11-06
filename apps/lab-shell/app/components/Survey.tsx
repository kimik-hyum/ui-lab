"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { CheckboxGroup } from "@base-ui/react/checkbox-group";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Field } from "@base-ui/react/field";
import { Fieldset } from "@base-ui/react/fieldset";
import { Form } from "@base-ui/react/form";
import { ArrowRight, CircleCheck } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ExperimentBox from "./ExperimentBox";
import type { BoxResizeOptions } from "./useResizableBox";
import { getSurveySelectionState, restoreSurveyDraft, sameSurveyAnswer, type SurveyDraft, type SurveySelection } from "./survey-selection";
import { useSurveySubmission } from "./useSurveySubmission";
import styles from "./survey.module.css";

export type { SurveyDraft, SurveySelection } from "./survey-selection";
export type SurveyOption = { id: string; title: string; content: ReactNode };

type Props = Omit<ComponentPropsWithoutRef<"section">, "title" | "children" | "onChange"> & {
  surveyId: string;
  title: string;
  description?: string;
  eyebrow?: string;
  selection: SurveySelection;
  options: readonly SurveyOption[];
  draft: SurveyDraft;
  onChange: (draft: SurveyDraft) => void;
  optionsClassName?: string;
  optionClassName?: string;
  optionResize?: BoxResizeOptions;
};

export default function Survey({
  surveyId, title, description, eyebrow, selection, options, draft: incomingDraft, onChange: changeDraft,
  className, optionsClassName, optionClassName, optionResize, ...props
}: Props) {
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const submission = useSurveySubmission(surveyId, {
    onRestore: (intent) => {
      changeDraft({ ...intent.draft, dirty: true });
      setCompleted(false);
      setOpen(true);
    },
    onResponse: (saved, userId) => {
      changeDraft(restoreSurveyDraft(incomingDraft, saved?.draft ?? null, userId));
    },
    onReset: () => {
      changeDraft({ optionIds: [], reason: "" });
      setOpen(false);
      setCompleted(false);
    },
  });
  const step = completed ? "success" : submission.user ? "reason" : "login";
  // A parent may cache several survey drafts across tabs. Never display another account's draft.
  const draft = !incomingDraft.ownerId || incomingDraft.ownerId === submission.user?.id
    ? incomingDraft : { optionIds: [], reason: "" };
  function onChange(next: SurveyDraft) {
    changeDraft({ ...next, ownerId: submission.user?.id, dirty: true });
  }
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogTitleRef = useRef<HTMLHeadingElement>(null);
  const completeRef = useRef<HTMLButtonElement>(null);
  const dialogReturnFocusRef = useRef<HTMLElement | null>(null);
  const state = getSurveySelectionState(selection, options.map((option) => option.id), draft.optionIds);
  const selectedOptions = options.filter((option) => state.selectedIds.includes(option.id));
  const multiple = selection.type === "checkbox";
  const remaining = Math.max(0, state.minimum - state.count);
  const saved = submission.response;
  const hasChanges = saved !== null && !sameSurveyAnswer(draft, saved.draft);
  const hasCompletionBar = state.count > 0 && !submission.checking;
  const selectionHint = !multiple ? "마음에 드는 UI 하나를 선택해주세요."
    : state.minimum === state.maximum ? `${state.minimum}개를 선택해주세요.`
      : state.minimum === 1 ? `최대 ${state.maximum}개까지 선택할 수 있어요.`
        : `최소 ${state.minimum}개, 최대 ${state.maximum}개를 선택해주세요.`;

  useEffect(() => {
    if (open) {
      if (step === "reason") textareaRef.current?.focus({ preventScroll: true });
      else dialogTitleRef.current?.focus({ preventScroll: true });
    }
  }, [open, step]);

  function openDialog() {
    if (submission.checking || submission.busy) return;
    dialogReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setCompleted(false);
    submission.clearError();
    setOpen(true);
  }

  function updateCheckboxes(ids: string[]) {
    const next = getSurveySelectionState(selection, options.map((option) => option.id), ids);
    if (next.count <= next.maximum) onChange({ ...draft, optionIds: next.selectedIds });
  }

  function requireLogin() {
    // Preserve the attempted edit when authentication expires, without retaining its old owner.
    changeDraft({ ...draft, ownerId: undefined, dirty: true });
    setCompleted(false);
    setOpen(true);
  }

  const cards = options.map((option, index) => {
    const selected = state.selectedIds.includes(option.id);
    return (
      <ExperimentBox key={option.id} as="article" className={cn(styles.option, optionClassName)}
        data-survey-option={option.id} title={option.title} headingId={`${surveyId}-${option.id}-title`} headingLevel={3} index={index}
        sticky="mobile" resize={optionResize} selection={{ type: selection.type, value: option.id, selected,
          submitted: saved?.draft.optionIds.includes(option.id),
          disabled: submission.checking || submission.busy || (multiple && state.atLimit && !selected), onReselect: openDialog }}>
        {option.content}
      </ExperimentBox>
    );
  });
  const groupProps = {
    "aria-labelledby": `${surveyId}-question`,
    "aria-describedby": `${surveyId}-selection-hint`,
    className: cn(styles.options, optionsClassName),
    "data-count": options.length,
    "data-resizable": Boolean(optionResize),
  };

  return (
    <section {...props} id={`${surveyId}-survey`} className={cn(styles.survey, className)}
      data-survey={surveyId} data-selection-type={selection.type} data-completion-bar={hasCompletionBar}
      aria-labelledby={`${surveyId}-question`}>
      <div className={styles.heading}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h2 id={`${surveyId}-question`} className={styles.question}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
        <p id={`${surveyId}-selection-hint`} className={styles.selectionHint}>{selectionHint}</p>
        {multiple && <p className={styles.selectionStatus} role="status">
          {state.count}개 선택{remaining > 0 ? ` · ${remaining}개 더 선택해주세요.` : state.atLimit ? " · 더 고르려면 선택한 UI를 먼저 해제해주세요." : " · 선택을 완료하고 이유를 남겨주세요."}
        </p>}
        {submission.user && <div className={styles.account}>
          <span>Google 로그인됨 · {submission.user.email}</span>
          <Button type="button" variant="ghost" size="sm" disabled={submission.busy} onClick={() => void submission.logout()}>로그아웃</Button>
        </div>}
        {submission.checking && <p className={styles.selectionStatus} role="status">내 응답을 확인하고 있어요.</p>}
      </div>
      {submission.loadError && <div className={styles.readError}>
        <p role="alert">{submission.loadError}</p>
        <Button type="button" variant="outline" size="sm" disabled={submission.checking || submission.busy} onClick={submission.reload}>다시 불러오기</Button>
      </div>}
      {saved && <aside className={styles.savedResponse} aria-labelledby={`${surveyId}-saved-title`} data-survey-response={surveyId}>
        <div className={styles.savedHeading}>
          <h3 id={`${surveyId}-saved-title`}><CircleCheck size={18} aria-hidden="true" />내가 제출한 응답</h3>
          <Button type="button" variant="outline" size="sm" disabled={submission.checking || submission.busy || !state.canComplete} onClick={openDialog}>
            {hasChanges ? "수정 이어가기" : "응답 수정"}
          </Button>
        </div>
        <ul className={styles.savedOptions}>{options.filter((option) => saved.draft.optionIds.includes(option.id)).map((option) => <li key={option.id}>{option.title}</li>)}</ul>
        <p className={styles.savedReason}>{saved.draft.reason || "선택 사유를 남기지 않았어요."}</p>
        <div className={styles.savedMeta}>
          <span>나에게만 보이는 응답입니다.</span>
          {saved.updatedAt && <time dateTime={saved.updatedAt}>마지막 제출 · {new Date(saved.updatedAt).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}</time>}
        </div>
        {hasChanges && <p className={styles.unsavedNotice} role="status">아직 제출하지 않은 변경사항이 있어요. 다시 제출하면 위 응답이 변경됩니다.</p>}
      </aside>}
      <Fieldset.Root className={styles.fieldset}>
        <Fieldset.Legend className="sr-only">{title}</Fieldset.Legend>
        {multiple ? (
          <CheckboxGroup {...groupProps} value={state.selectedIds} onValueChange={updateCheckboxes}>{cards}</CheckboxGroup>
        ) : (
          <RadioGroup<string | null> {...groupProps} name={surveyId} value={state.selectedIds[0] ?? null}
            onValueChange={(id) => {
              if (id !== null) {
                onChange({ ...draft, optionIds: [id] });
                openDialog();
              }
            }}>{cards}</RadioGroup>
        )}
      </Fieldset.Root>
      {hasCompletionBar && (
        <div className={styles.completionBar} data-survey-completion={surveyId}>
          <div className={styles.completionContent}>
            <div className={styles.completionSummary}>
              <strong>{saved && !hasChanges ? "제출한 응답" : `${state.count}개 선택`}</strong>
              <span>{!multiple ? selectedOptions[0]?.title : remaining > 0 ? `${remaining}개 더 선택하면 완료할 수 있어요.` : selectionHint}</span>
            </div>
            <Button ref={completeRef} type="button" disabled={!state.canComplete || submission.checking || submission.busy} onClick={openDialog} className={styles.completeButton}>
              {saved ? hasChanges ? "변경사항 제출" : "응답 수정" : "선택 완료"}<ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
      <Dialog open={open && state.canComplete} onOpenChange={(next) => { if (!submission.busy) setOpen(next); }}>
        <DialogContent initialFocus={step === "reason" ? textareaRef : dialogTitleRef}
          showCloseButton={!submission.busy}
          finalFocus={() => dialogReturnFocusRef.current?.isConnected ? dialogReturnFocusRef.current : completeRef.current ?? true}
          className={styles.dialog}>
          <DialogHeader>
            <span className={styles.eyebrow}>{step === "success" ? "의견이 저장됐어요" : step === "reason" ? "당신의 선택을 들려주세요" : "먼저 로그인해주세요"}</span>
            <DialogTitle ref={dialogTitleRef} tabIndex={-1} className={styles.dialogTitle}>
              {step === "success" ? "선택을 들려주셔서 고마워요" : step === "reason" ? "어떤 점이 마음에 들었나요?" : "로그인하고 의견 남기기"}
            </DialogTitle>
            <DialogDescription className={styles.dialogDescription}>
              {step === "success" ? "다시 제출하면 이전 응답이 새 선택으로 변경됩니다." : step === "reason" ? "선택한 UI가 편했던 이유를 짧게 남겨주세요." : "Google 로그인 후 선택한 이유를 작성할 수 있어요. 마지막에 제출 버튼을 누르면 응답이 저장됩니다."}
            </DialogDescription>
          </DialogHeader>
          <div className={styles.summary}>
            <span>선택한 UI · {state.count}개</span>
            <ul>{selectedOptions.map((option) => <li key={option.id}>{option.title}</li>)}</ul>
            {step !== "reason" && draft.reason.trim() && <p>{draft.reason.trim()}</p>}
          </div>
          {submission.error && <p className={styles.error} role="alert">{submission.error}</p>}
          {step === "reason" ? (
            <Form className={styles.form} onFormSubmit={() => {
              if (!state.canComplete || submission.checking || submission.busy) return;
              submission.clearError();
              void submission.save(draft, (answer) => { changeDraft(answer); setCompleted(true); }, requireLogin);
            }} aria-label="설문 선택 사유">
              <Field.Root name="reason">
                <Field.Label className={styles.reasonLabel}>선택한 이유 <span>선택</span></Field.Label>
                <Field.Control ref={textareaRef} id={`${surveyId}-reason`} render={<textarea rows={4} />} maxLength={300}
                  value={draft.reason} disabled={submission.busy} onValueChange={(reason) => onChange({ ...draft, reason })}
                  placeholder="어떤 점이 편했는지, 실제로 쓰고 싶은 이유를 들려주세요." aria-describedby={`${surveyId}-reason-count`} />
                <div className={styles.inputMeta}>
                  <Field.Description>짧은 한마디도 좋아요.</Field.Description>
                  <span id={`${surveyId}-reason-count`}>{draft.reason.length} / 300</span>
                </div>
              </Field.Root>
              <Button type="submit" disabled={submission.checking || submission.busy} className={styles.nextButton}>
                {submission.checking ? "내 응답 확인 중" : submission.busy ? "저장 중…" : saved ? "응답 수정하기" : "의견 제출"}<ArrowRight aria-hidden="true" />
              </Button>
              <DialogClose render={<Button type="button" variant="ghost" disabled={submission.busy} className={styles.backButton} />}>계속 비교하기</DialogClose>
              <p className={styles.notice}>선택 사유는 공개되지 않으며 UI 개선을 위해 참고합니다.</p>
            </Form>
          ) : step === "success" ? (
            <DialogClose render={<Button type="button" className={styles.nextButton} />}>다시 둘러보기</DialogClose>
          ) : (
            <>
              <Button type="button" variant="outline" className={styles.googleButton}
                disabled={submission.busy || submission.checking} aria-describedby={`${surveyId}-login-notice`}
                onClick={() => void submission.login(draft)}>
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                  <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.36Z" />
                  <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.51c-.9.6-2.04.97-3.39.97-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z" />
                  <path fill="#FBBC05" d="M6.4 13.93a6 6 0 0 1 0-3.86V7.48H3.06a10 10 0 0 0 0 9.04l3.34-2.59Z" />
                  <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.48l3.34 2.59C7.19 7.71 9.4 5.95 12 5.95Z" />
                </svg>
                {submission.busy ? "연결 중…" : "Google로 로그인하기"}
              </Button>
              <p id={`${surveyId}-login-notice`} className={styles.notice}>로그인하는 동안 선택한 UI를 이 탭에 보관합니다.</p>
              <DialogClose render={<Button type="button" variant="ghost" disabled={submission.busy} className={styles.backButton} />}>계속 비교하기</DialogClose>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
