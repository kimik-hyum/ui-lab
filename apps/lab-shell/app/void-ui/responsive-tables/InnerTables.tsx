"use client";

import { Fragment, useState } from "react";
import { ChevronRight, CircleAlert, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  performanceDays, summarizeDay, formatVolume, formatAchievement, formatRejection,
  type PerformanceDay, type PerformanceMetrics, type TimeSlot,
} from "./weekly-performance";
import shared from "./responsive-tables.module.css";
import styles from "./inner-tables.module.css";

const patterns = [
  {
    id: "scroll", title: "공통 열 + 가로 스크롤", label: "열 정렬 그대로",
    description: "요일 합계 아래로 시간대 행을 펼칩니다. 모든 행이 같은 열을 공유합니다.",
    hint: "요일을 펼친 뒤 좌우로 밀어 지표를 비교해 보세요.",
    note: "작은 화면에서도 원래 표 구조를 유지합니다. 오른쪽 지표는 스크롤해서 확인합니다.",
  },
  {
    id: "sticky", title: "요일 고정 + 상세 행", label: "요일을 고정하기",
    description: "같은 표를 유지하면서 요일과 상단 헤더를 고정합니다.",
    hint: "좌우 · 위아래로 움직여도 요일과 열 제목은 남습니다.",
    note: "어느 요일의 수치인지 놓치지 않습니다. 고정 열이 작은 화면의 일부를 차지합니다.",
  },
  {
    id: "cards", title: "요일별 아코디언", label: "요일마다 묶어 읽기",
    description: "요일 합계를 카드 머리로 바꾸고, 펼치면 시간대별 지표를 세로로 보여줍니다.",
    hint: "요일을 눌러 같은 그룹에 속한 시간대들을 펼쳐 보세요.",
    note: "요일과 상세 정보의 관계가 선명합니다. 다른 시간대의 숫자를 가로로 비교하기는 어렵습니다.",
  },
  {
    id: "stacked", title: "상세 행을 두 줄로", label: "지표를 아래로 재배치",
    description: "요일과 완료/목표는 유지하고, 거절·달성률을 각 행 아래로 내립니다.",
    hint: "가로 스크롤 없이 요일과 상세 행의 연결을 확인해 보세요.",
    note: "모든 지표를 화면 안에 담습니다. 행이 높아져 한 번에 보이는 시간대는 줄어듭니다.",
  },
] as const;

type Pattern = (typeof patterns)[number];

function Rejection({ metrics }: { metrics: PerformanceMetrics }) {
  return <span className={metrics.rejected ? styles.rejected : undefined}>{formatRejection(metrics)}</span>;
}

function CurrentBadge({ day }: { day: PerformanceDay }) {
  return day.state === "current" ? <span className={styles.currentBadge}>진행중</span> : null;
}

function SlotLabel({ slot }: { slot: TimeSlot }) {
  return (
    <span className={styles.slotLabel}>
      {slot.completed < slot.target && <CircleAlert className={styles.alertIcon} size={13} aria-label="목표 미달" />}
      <span>{slot.label} <span className={styles.slotVolume}>({formatVolume(slot)})</span></span>
    </span>
  );
}

function MetricsDetails({ metrics, includeVolume = false }: { metrics: PerformanceMetrics; includeVolume?: boolean }) {
  return (
    <dl className={styles.metricsDetails}>
      {includeVolume && <div><dt>완료/목표</dt><dd>{formatVolume(metrics)}</dd></div>}
      <div><dt>거절(거절률)</dt><dd><Rejection metrics={metrics} /></dd></div>
      <div><dt>달성률</dt><dd>{formatAchievement(metrics)}</dd></div>
    </dl>
  );
}

function InnerTableExperiment({ pattern, index }: { pattern: Pattern; index: number }) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["thu", "fri", "sat", "sun"]));
  const expandableDays = performanceDays.filter((day) => day.slots.length);
  const allExpanded = expandableDays.every((day) => expanded.has(day.id));
  const prefix = `inner-${pattern.id}`;

  function toggleDay(id: string) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className={shared.experiment} data-inner-pattern={pattern.id} aria-labelledby={`${prefix}-title`}>
      <header className={shared.patternHeader}>
        <div className={shared.patternTitle}>
          <span className={shared.number}>{String(index + 1).padStart(2, "0")}</span>
          <h2 id={`${prefix}-title`}>{pattern.title}</h2>
        </div>
        <p>{pattern.description}</p>
      </header>
      <div className={styles.preview}>
        <div className={shared.sampleToolbar}>
          <span>요일별 달성 현황 <span className={shared.count}>{performanceDays.length}일</span></span>
          <Button type="button" size="sm" variant="ghost" className={styles.expandAll}
            onClick={() => setExpanded(allExpanded ? new Set() : new Set(expandableDays.map((day) => day.id)))}>
            {allExpanded ? "모두 접기" : "모두 펼치기"}
          </Button>
        </div>
        <p className={styles.hint}><Rows3 size={13} aria-hidden="true" />{pattern.hint}</p>
        <div className={styles.tableFrame} tabIndex={0} role="region" aria-label={`${pattern.title} · 표 스크롤 영역`}>
          <table className={styles.table}>
            <caption className="sr-only">요일별 합계와 펼칠 수 있는 시간대 상세 행. 완료/목표, 거절, 달성률 열을 공유합니다.</caption>
            <colgroup>
              <col className={styles.toggleColumn} /><col className={styles.dayColumn} />
              <col className={styles.volumeColumn} /><col className={styles.rejectionColumn} /><col className={styles.achievementColumn} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className={styles.toggleCell}><span className="sr-only">시간대 펼치기</span></th>
                <th scope="col" id={`${prefix}-day-heading`} className={styles.dayCell}>요일</th>
                <th scope="col" id={`${prefix}-volume-heading`}>완료물량/목표물량</th>
                <th scope="col" id={`${prefix}-rejection-heading`} className={styles.secondaryCell}>거절 물량(거절률)</th>
                <th scope="col" id={`${prefix}-achievement-heading`} className={styles.secondaryCell}>달성률</th>
              </tr>
            </thead>
            {performanceDays.map((day) => {
              const total = summarizeDay(day);
              const isExpanded = expanded.has(day.id);
              const dayId = `${prefix}-${day.id}`;
              const rowIds = day.slots.flatMap((slot) => [`${dayId}-${slot.id}`, `${dayId}-${slot.id}-metrics`]).join(" ");
              return (
                <tbody key={day.id} className={styles.dayGroup} data-current={day.state === "current"} data-upcoming={day.state === "upcoming"}>
                  <tr className={styles.parentRow}>
                    <td className={styles.toggleCell}>
                      {day.slots.length ? (
                        <Button type="button" variant="ghost" size="icon-sm" className={styles.disclosure}
                          aria-expanded={isExpanded} aria-controls={rowIds}
                          aria-label={`${day.label} 시간대 ${isExpanded ? "접기" : "펼치기"}`}
                          onClick={() => toggleDay(day.id)}>
                          <ChevronRight aria-hidden="true" />
                        </Button>
                      ) : <span aria-hidden="true">-</span>}
                    </td>
                    <th scope="row" id={dayId} className={styles.dayCell}>
                      <span className={styles.dayName}>{day.label}<CurrentBadge day={day} /></span>
                    </th>
                    <td>{day.slots.length ? formatVolume(total) : <span className={styles.empty}>등록된 시간대 없음</span>}</td>
                    <td className={styles.secondaryCell}><Rejection metrics={total} /></td>
                    <td className={styles.secondaryCell}>{formatAchievement(total)}</td>
                  </tr>
                  <tr className={`${styles.rowDetails} ${styles.parentDetails}`}><td colSpan={3}><MetricsDetails metrics={total} /></td></tr>
                  {day.slots.map((slot) => {
                    const slotId = `${dayId}-${slot.id}`;
                    return (
                      <Fragment key={slot.id}>
                        <tr id={slotId} className={styles.childRow} hidden={!isExpanded}>
                          <td className={styles.toggleCell} /><td className={styles.dayCell} />
                          <th scope="row" id={`${slotId}-label`} headers={`${dayId} ${prefix}-volume-heading`}><SlotLabel slot={slot} /></th>
                          <td className={styles.secondaryCell} headers={`${dayId} ${slotId}-label ${prefix}-rejection-heading`}><Rejection metrics={slot} /></td>
                          <td className={styles.secondaryCell} headers={`${dayId} ${slotId}-label ${prefix}-achievement-heading`}>{formatAchievement(slot)}</td>
                        </tr>
                        <tr id={`${slotId}-metrics`} className={`${styles.rowDetails} ${styles.childDetails}`} hidden={!isExpanded}>
                          <td colSpan={3}><MetricsDetails metrics={slot} /></td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              );
            })}
          </table>
        </div>
        {pattern.id === "cards" && (
          <div className={styles.cardFrame} tabIndex={0} role="region" aria-label="요일별 아코디언 · 스크롤 영역">
            <ul className={styles.dayCards}>
              {performanceDays.map((day) => {
                const isExpanded = expanded.has(day.id);
                const total = summarizeDay(day);
                const detailsId = `${prefix}-${day.id}-card-details`;
                return (
                  <li key={day.id} className={styles.dayCard} data-current={day.state === "current"}>
                    <div className={styles.cardSummary}>
                      {day.slots.length ? (
                        <Button type="button" variant="ghost" className={styles.cardToggle}
                          aria-expanded={isExpanded} aria-controls={detailsId} onClick={() => toggleDay(day.id)}>
                          <span className={styles.dayName}>{day.label}<CurrentBadge day={day} /></span>
                          <ChevronRight aria-hidden="true" />
                        </Button>
                      ) : <p className={styles.emptyDay}>{day.label}</p>}
                      <MetricsDetails metrics={total} includeVolume />
                    </div>
                    {day.slots.length ? (
                      <ul id={detailsId} className={styles.slotCards} hidden={!isExpanded} aria-label={`${day.label} 시간대 상세`}>
                        {day.slots.map((slot) => (
                          <li key={slot.id}><SlotLabel slot={slot} /><MetricsDetails metrics={slot} /></li>
                        ))}
                      </ul>
                    ) : <p className={styles.emptyCard}>등록된 시간대가 없습니다.</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <p className={shared.patternNote}>{pattern.note}</p>
    </section>
  );
}

export default function InnerTables() {
  return patterns.map((pattern, index) => <InnerTableExperiment key={pattern.id} pattern={pattern} index={index} />);
}
