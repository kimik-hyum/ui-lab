"use client";

import { useId, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from "react";
import { Radio } from "@base-ui/react/radio";
import { Checkbox } from "@base-ui/react/checkbox";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import useStickyHeading from "./useStickyHeading";
import useResizableBox, { type BoxResizeOptions, type ResizeDirection } from "./useResizableBox";
import styles from "./experiment-box.module.css";

const resizeDirections: ResizeDirection[] = ["n", "e", "s", "w", "ne", "se", "sw", "nw"];

type Props = Omit<ComponentPropsWithoutRef<"section">, "title" | "children"> & {
  as?: "section" | "article";
  title: string;
  headingId?: string;
  headingLevel?: 2 | 3;
  index?: number;
  description?: string;
  sticky?: "always" | "mobile" | "none";
  resize?: BoxResizeOptions;
  /** Render inside Survey or a controlled Base UI selection group; value must be a stable option ID. */
  selection?: { type?: "radio" | "checkbox"; value: string; selected: boolean; submitted?: boolean; disabled?: boolean; onReselect?: () => void };
  children: ReactNode;
};

export default function ExperimentBox({
  as: Root = "section", title, headingId, headingLevel = 2, index, description,
  sticky = "always", resize, selection, className, style, children, ...props
}: Props) {
  const generatedId = useId();
  const titleId = headingId ?? generatedId;
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const { headerRef, stuck } = useStickyHeading();
  const { boxRef, width, height, actualWidth, actualHeight, resizing, minWidth, maxWidth, minHeight, maxHeight, resetSize, getHandleProps } = useResizableBox(resize);
  const headingContent = (
    <>
      <span className={styles.titleGroup}>
        {index !== undefined && <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>}
        <span className={styles.title}>{title}</span>
      </span>
      {selection && (
        <span className={styles.choiceControl}>
          {selection.type === "checkbox" ? (
            <Checkbox.Root className={cn(styles.control, styles.checkbox)} value={selection.value} disabled={selection.disabled} aria-label={`${title} 선택`}>
              <Checkbox.Indicator><Check size={14} strokeWidth={3} aria-hidden="true" /></Checkbox.Indicator>
            </Checkbox.Root>
          ) : (
            <Radio.Root className={styles.control} value={selection.value} disabled={selection.disabled} aria-label={`${title} 선택`}
              onClick={() => { if (selection.selected) selection.onReselect?.(); }}>
              <Radio.Indicator className={styles.radioIndicator} />
            </Radio.Root>
          )}
          <span>{selection.submitted ? "제출한 선택" : selection.selected ? "선택됨" : selection.disabled ? "선택 불가" : "이 UI 선택"}</span>
        </span>
      )}
    </>
  );

  return (
    <Root {...props} ref={boxRef} className={cn(styles.box, className)} aria-labelledby={titleId}
      style={{ ...style, ...(resize && { "--experiment-width": `${width}px`, "--experiment-height": `${height}px` }) } as CSSProperties}
      data-experiment-box="" data-sticky={sticky} data-selectable={Boolean(selection)} data-selected={selection?.selected ?? false}
      data-resizable={Boolean(resize)} data-resizing={resizing}
      data-selection-disabled={selection?.disabled ?? false}>
      <header ref={headerRef} className={styles.header} data-stuck={stuck}>
        <Heading id={titleId} className={styles.heading}>
          {selection
            ? <label className={styles.headingContent}>{headingContent}</label>
            : <span className={styles.headingContent}>{headingContent}</span>}
        </Heading>
      </header>
      {description && <p className={styles.description}>{description}</p>}
      {resize ? <div className={styles.resizableContent}>{children}</div> : children}
      {resize && <>
        <div className={styles.resizeFooter}>
          <span id={`${titleId}-resize-help`}>테두리·모서리를 드래그해 보세요</span>
          <span className={styles.sizeValue}>{actualWidth} × {actualHeight}</span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={resetSize}
            aria-label={`${title} 크기 초기화`} title="기본 크기로 초기화"><RotateCcw aria-hidden="true" /></Button>
        </div>
        {resizeDirections.map((direction) => {
          const horizontal = direction === "e";
          const keyboardHandle = horizontal || direction === "s";
          return <div key={direction} {...getHandleProps(direction)} className={styles.resizeHandle} data-resize-direction={direction}
            role={keyboardHandle ? "slider" : undefined} tabIndex={keyboardHandle ? 0 : undefined} aria-hidden={!keyboardHandle || undefined}
            aria-label={keyboardHandle ? `${title} 미리보기 ${horizontal ? "너비" : "높이"}` : undefined}
            aria-describedby={keyboardHandle ? `${titleId}-resize-help` : undefined}
            aria-orientation={keyboardHandle ? horizontal ? "horizontal" : "vertical" : undefined}
            aria-valuemin={keyboardHandle ? horizontal ? minWidth : minHeight : undefined}
            aria-valuemax={keyboardHandle ? horizontal ? maxWidth : maxHeight : undefined}
            aria-valuenow={keyboardHandle ? horizontal ? actualWidth : actualHeight : undefined}
            aria-valuetext={keyboardHandle ? `${horizontal ? actualWidth : actualHeight}픽셀` : undefined} />;
        })}
      </>}
    </Root>
  );
}
