"use client";

import type { CSSProperties, ReactNode } from "react";
import Survey, { type SurveyDraft, type SurveySelection } from "@/app/components/Survey";
import styles from "./table-preference.module.css";

const MOBILE_PREVIEW_HEIGHT = 800;
// Desktop cards also include the heading (88), resize footer (42), and borders (2).
const DEFAULT_CARD_HEIGHT = MOBILE_PREVIEW_HEIGHT + 88 + 42 + 2;

export type PreferenceDraft = SurveyDraft;
type Props = {
  surveyKey: string;
  draft: PreferenceDraft;
  onChange: (draft: PreferenceDraft) => void;
  selection: SurveySelection;
  options: readonly { id: string; title: string; preview: ReactNode }[];
  standalone: boolean;
  previewWidth: number;
};

export default function TablePreference({ surveyKey, draft, onChange, selection, options, standalone, previewWidth }: Props) {
  const description = `${standalone ? "아래 카드에서 직접 스크롤하거나 펼쳐 보세요." : "작은 화면으로 한 번 더 비교해 보세요."} ${selection.type === "radio"
    ? "마음에 드는 UI를 선택하면 모달에서 이유를 남길 수 있어요."
    : "마음에 드는 UI들을 고른 뒤, 하단의 ‘선택 완료’를 눌러 이유를 남겨주세요."}`;

  return (
    <Survey surveyId={surveyKey} draft={draft} onChange={onChange} selection={selection}
      title={standalone ? "모바일에서는 어떤 UI가 가장 편한가요?" : "모바일에서는 어떤 UI가 가장 편했나요?"}
      description={description} eyebrow={standalone ? "모바일로 비교하고 선택하기" : "마지막으로, 당신의 선택"}
      options={options.map((option) => ({ id: option.id, title: option.title, content: option.preview }))}
      optionResize={{ defaultWidth: previewWidth, minWidth: 320, defaultHeight: DEFAULT_CARD_HEIGHT }}
      style={{ "--table-preview-height": `${MOBILE_PREVIEW_HEIGHT}px` } as CSSProperties}
      className={styles.survey} optionsClassName={styles.options} optionClassName={styles.option}
      data-table-survey={surveyKey} data-standalone={standalone} />
  );
}
