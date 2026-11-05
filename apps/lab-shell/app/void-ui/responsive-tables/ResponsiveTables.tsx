"use client";

import { Fragment, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeftRight, ChevronDown, Columns3, Layers3, Monitor, Smartphone, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAmount, orders, type Order } from "./orders";
import InnerTables from "./InnerTables";
import OrderStatus from "./OrderStatus";
import TablePreference, { type PreferenceDraft } from "./TablePreference";
import ExperimentBox from "@/app/components/ExperimentBox";
import { flatPatterns as patterns, innerPatterns } from "./table-patterns";
import styles from "./responsive-tables.module.css";

// Keep this breakpoint aligned with the mobile rules in the table styles.
const mobileViewportQuery = "(width < 768px)";

function subscribeToMobileViewport(onChange: () => void) {
  const media = window.matchMedia(mobileViewportQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getMobileViewportSnapshot() {
  return window.matchMedia(mobileViewportQuery).matches;
}

function getServerMobileViewportSnapshot() {
  return false;
}

type Pattern = (typeof patterns)[number];

function OrderDetails({ order }: { order: Order }) {
  return (
    <dl className={styles.details}>
      <div><dt>고객</dt><dd>{order.customer}</dd></div>
      <div><dt>주문일</dt><dd>{order.date}</dd></div>
      <div><dt>담당자</dt><dd>{order.manager}</dd></div>
    </dl>
  );
}

function OrderCards() {
  return (
    <ul className={styles.cards} aria-label="주문 카드 목록">
      {orders.map((order) => (
        <li key={order.id} className={styles.orderCard}>
          <div className={styles.cardHeading}>
            <span className={styles.orderId}>{order.id}</span>
            <OrderStatus status={order.status} />
          </div>
          <p className={styles.cardProduct}>{order.product}</p>
          <p className={styles.cardAmount}>{formatAmount(order.amount)}</p>
          <OrderDetails order={order} />
        </li>
      ))}
    </ul>
  );
}

function TableExperiment({ pattern, index, previewOnly = false }: { pattern: Pattern; index: number; previewOnly?: boolean }) {
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const tableId = `${previewOnly ? "vote-" : ""}table-${pattern.id}`;
  const toggleOrder = (id: string) => {
    setExpandedOrders((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const content = (
    <>
      <div className={styles.preview}>
        <div className={styles.sampleToolbar}>
          <span>주문 목록 <span className={styles.count}>8</span></span>
          <span className={styles.wideLabel}>공통 데스크톱 표</span>
          <span className={styles.narrowLabel}>{pattern.label}</span>
        </div>
        <div className={styles.mobileHint}>
          <ArrowLeftRight size={13} aria-hidden="true" />
          <span>{pattern.hint}</span>
        </div>
        {pattern.id === "priority" && (
          <div className={styles.columnControl}>
            <Button
              variant="outline" size="sm" type="button"
              aria-expanded={showAllColumns} aria-controls={tableId}
              onClick={() => setShowAllColumns((previous) => !previous)}
            >
              <Columns3 aria-hidden="true" />
              {showAllColumns ? "핵심 3개 열만 보기" : "숨긴 3개 열 보기"}
            </Button>
          </div>
        )}
        <div
          className={styles.scrollFrame} tabIndex={0} role="region"
          aria-label={`${pattern.title} 주문 목록 · 스크롤 영역`}
          data-show-all={showAllColumns}
        >
          <table className={styles.table} id={tableId}>
            <caption className="sr-only">{pattern.title} 실험용 가상 주문 8건</caption>
            <thead>
              <tr>
                <th scope="col" className={styles.orderColumn}>주문</th>
                <th scope="col" className={styles.secondaryColumn}>고객</th>
                <th scope="col" className={styles.amountColumn}>금액</th>
                <th scope="col" className={styles.statusColumn}>상태</th>
                <th scope="col" className={styles.secondaryColumn}>주문일</th>
                <th scope="col" className={styles.secondaryColumn}>담당자</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const isExpanded = expandedOrders.has(order.id);
                const detailId = `${previewOnly ? "vote-" : ""}${pattern.id}-${order.id}-details`;
                return (
                  <Fragment key={order.id}>
                    <tr>
                      <th scope="row" className={styles.orderColumn}>
                        <div className={styles.orderIdentity}>
                          {pattern.id === "expand" && (
                            <Button
                              className={styles.expandButton} variant="ghost" size="icon-sm" type="button"
                              aria-expanded={isExpanded} aria-controls={detailId}
                              aria-label={`주문 ${order.id} 상세 ${isExpanded ? "접기" : "펼치기"}`}
                              onClick={() => toggleOrder(order.id)}
                            >
                              <ChevronDown aria-hidden="true" />
                            </Button>
                          )}
                          <div className={styles.orderText}>
                            <span className={styles.orderId}>{order.id}</span>
                            <span className={styles.product}>{order.product}</span>
                          </div>
                        </div>
                      </th>
                      <td className={styles.secondaryColumn}>{order.customer}</td>
                      <td className={styles.amountColumn}>{formatAmount(order.amount)}</td>
                      <td className={styles.statusColumn}><OrderStatus status={order.status} /></td>
                      <td className={styles.secondaryColumn}>{order.date}</td>
                      <td className={styles.secondaryColumn}>{order.manager}</td>
                    </tr>
                    {(pattern.id === "popin" || pattern.id === "expand") && (
                      <tr className={styles.detailRow} id={detailId} hidden={pattern.id === "expand" && !isExpanded}>
                        <td colSpan={3}><OrderDetails order={order} /></td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {pattern.id === "cards" && <OrderCards />}
        </div>
      </div>
      {!previewOnly && <p className={styles.patternNote}>{pattern.note}</p>}
    </>
  );

  return previewOnly ? (
    <section className={styles.votePreview} data-pattern={pattern.id} data-vote-preview="true" aria-label={`${pattern.title} 모바일 미리보기`}>
      {content}
    </section>
  ) : (
    <ExperimentBox className={styles.experiment} title={pattern.title} description={pattern.description}
      headingId={`pattern-${pattern.id}`} index={index} data-pattern={pattern.id} data-vote-preview="false">
      {content}
    </ExperimentBox>
  );
}

export default function ResponsiveTables() {
  const searchParams = useSearchParams();
  const isInner = searchParams.get("table") === "inner";
  const [compact, setCompact] = useState(false);
  const isMobile = useSyncExternalStore(subscribeToMobileViewport, getMobileViewportSnapshot, getServerMobileViewportSnapshot);
  const surveyOnly = isMobile || compact;
  const [previewWidth, setPreviewWidth] = useState(390);
  const [drafts, setDrafts] = useState<Record<"flat" | "inner", PreferenceDraft>>({
    flat: { optionIds: [], reason: "" },
    inner: { optionIds: [], reason: "" },
  });
  const tableKind = isInner ? "inner" : "flat";
  const surveyKey = `responsive-tables-${tableKind}-v1`;
  const activeContentId = surveyOnly ? `${surveyKey}-survey` : "table-experiments";

  function selectTable(inner: boolean) {
    const url = new URL(window.location.href);
    if (inner) url.searchParams.set("table", "inner");
    else url.searchParams.delete("table");
    if (url.href !== window.location.href) window.history.pushState(null, "", url);
  }

  return (
    <div className={styles.lab}>
      <div className={styles.tableTypes} role="group" aria-label="테이블 구조 선택">
        <Button type="button" variant={isInner ? "outline" : "default"} aria-pressed={!isInner} aria-controls={activeContentId} onClick={() => selectTable(false)}>
          <Table2 aria-hidden="true" />기본 테이블 <span>6</span>
        </Button>
        <Button type="button" variant={isInner ? "default" : "outline"} aria-pressed={isInner} aria-controls={activeContentId} onClick={() => selectTable(true)}>
          <Layers3 aria-hidden="true" />Inner Table <span>4</span>
        </Button>
      </div>
      {isInner && (
        <div className={styles.innerIntro}>
          <strong>요일을 펼치면, 같은 열 아래로 시간대 상세가.</strong>
          <p>요일 합계와 시간대별 상세 행이 완료/목표 · 거절 · 달성률 열을 공유합니다. PC에서는 같은 표를, 작은 화면에서는 네 가지 표현을 비교합니다.</p>
          <span>요일별 펼치기·접기 / 진행중 강조 / 상세 행이 없는 요일</span>
        </div>
      )}
      <div className={styles.controls}>
        <div className={styles.modeButtons} role="group" aria-label="미리보기 방식">
          <Button type="button" variant={compact ? "ghost" : "default"} aria-pressed={!compact} onClick={() => setCompact(false)}>
            <Monitor aria-hidden="true" /> PC 사이즈
          </Button>
          <Button type="button" variant={compact ? "default" : "ghost"} aria-pressed={compact} onClick={() => setCompact(true)}>
            <Smartphone aria-hidden="true" /> 모바일 모아보기
          </Button>
        </div>
        {compact ? (
          <div className={styles.widthControl}>
            <label htmlFor="preview-width">전체 미리보기 너비</label>
            <input
              id="preview-width" type="range" min="320" max="520" step="10" value={previewWidth}
              aria-valuetext={`${previewWidth}픽셀, 화면보다 넓으면 화면에 맞춤`}
              onChange={(event) => setPreviewWidth(Number(event.target.value))}
            />
            <output htmlFor="preview-width">{previewWidth}px</output>
          </div>
        ) : (
          <p className={styles.controlHint}>창을 줄이거나, 모바일 모아보기로 나란히 비교해 보세요.</p>
        )}
      </div>
      <div className={styles.legend}>
        <p><span aria-hidden="true" />{isInner ? "같은 요일 · 같은 시간대 · 네 가지 반응" : "같은 데이터 · 같은 열 · 여섯 가지 반응"}</p>
        <span>{isInner ? "고정된 예시 데이터이며 실제 실적이 아닙니다." : "가상의 상품 · 고객을 사용한 실험입니다."}</span>
      </div>
      <div id="table-experiments" className={styles.experiments} hidden={surveyOnly}>
        {isInner ? <InnerTables /> : patterns.map((pattern, index) => <TableExperiment key={pattern.id} pattern={pattern} index={index} />)}
      </div>
      {isInner && !surveyOnly && <p className={`${styles.metricNote} mt-4 text-[11px] leading-6 text-muted-foreground`}>예시 지표: 달성률 = 완료 ÷ 목표, 거절률 = 거절 ÷ (완료 + 거절). 요일 합계는 시간대별 수치를 합산합니다.</p>}
      <TablePreference key={tableKind} surveyKey={surveyKey} draft={drafts[tableKind]} standalone={surveyOnly} previewWidth={isMobile ? 390 : previewWidth}
        selection={isInner ? { type: "checkbox", minSelections: 2, maxSelections: 3 } : { type: "radio" }}
        onChange={(draft) => setDrafts((previous) => ({ ...previous, [tableKind]: draft }))}
        options={isInner
          ? innerPatterns.map((pattern) => ({ id: pattern.id, title: pattern.title, preview: <InnerTables previewPatternId={pattern.id} /> }))
          : patterns.map((pattern, index) => ({ id: pattern.id, title: pattern.title, preview: <TableExperiment pattern={pattern} index={index} previewOnly /> }))}
      />
    </div>
  );
}
