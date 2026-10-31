"use client";

import { Fragment, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeftRight, ChevronDown, Columns3, Layers3, Monitor, Smartphone, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAmount, orders, type Order } from "./orders";
import InnerTables from "./InnerTables";
import OrderStatus from "./OrderStatus";
import styles from "./responsive-tables.module.css";

const patterns = [
  {
    id: "scroll", title: "가로 스크롤", label: "구조 그대로",
    description: "표를 유지하고, 화면 밖의 열은 옆으로 밀어 봅니다.",
    hint: "표 안을 좌우로 스크롤해 보세요.",
    note: "열 간 비교에 익숙한 표. 멀리 이동하면 행의 기준을 놓칠 수 있습니다.",
  },
  {
    id: "sticky", title: "헤더 · 첫 열 고정", label: "기준을 붙잡기",
    description: "가로로는 주문을, 세로로는 열 제목을 고정합니다.",
    hint: "좌우 · 위아래로 움직여도 기준은 남습니다.",
    note: "비교할 열과 행이 많을 때. 고정 영역만큼 내용의 공간은 줄어듭니다.",
  },
  {
    id: "cards", title: "카드로 전환", label: "한 건에 집중",
    description: "행 하나를 카드 하나로 바꿔, 정보를 묶어 읽습니다.",
    hint: "아래로 스크롤하며 주문을 한 건씩 읽어 보세요.",
    note: "개별 항목을 읽기 편합니다. 여러 주문의 같은 값을 비교하기는 어렵습니다.",
  },
  {
    id: "priority", title: "중요한 열 먼저", label: "핵심만 남기기",
    description: "주문 · 금액 · 상태를 남기고, 나머지 열은 잠시 숨깁니다.",
    hint: "필요할 때 숨긴 열을 다시 꺼내 볼 수 있습니다.",
    note: "빠르게 훑는 목록에 적합합니다. 정보의 우선순위를 먼저 정해야 합니다.",
  },
  {
    id: "popin", title: "행 아래로 재배치", label: "정보를 모두 펼치기",
    description: "넘치는 열을 해당 행 아래로 내려 함께 보여줍니다.",
    hint: "고객 · 주문일 · 담당자가 각 행 아래에 이어집니다.",
    note: "추가 조작 없이 모든 정보를 읽습니다. 한 화면에 보이는 행은 줄어듭니다.",
  },
  {
    id: "expand", title: "필요한 행만 펼치기", label: "목록 + 상세",
    description: "핵심 정보로 훑어보고, 궁금한 주문만 펼쳐 봅니다.",
    hint: "주문 옆 화살표를 눌러 상세 정보를 펼쳐 보세요.",
    note: "긴 목록을 간결하게 유지합니다. 상세 비교에는 펼치는 조작이 필요합니다.",
  },
] as const;

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

function TableExperiment({ pattern, index }: { pattern: Pattern; index: number }) {
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const toggleOrder = (id: string) => {
    setExpandedOrders((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className={styles.experiment} data-pattern={pattern.id} aria-labelledby={`pattern-${pattern.id}`}>
      <header className={styles.patternHeader}>
        <div className={styles.patternTitle}>
          <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
          <h2 id={`pattern-${pattern.id}`}>{pattern.title}</h2>
        </div>
        <p>{pattern.description}</p>
      </header>
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
              aria-expanded={showAllColumns} aria-controls="table-priority"
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
          <table className={styles.table} id={`table-${pattern.id}`}>
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
                const detailId = `${pattern.id}-${order.id}-details`;
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
      <p className={styles.patternNote}>{pattern.note}</p>
    </section>
  );
}

export default function ResponsiveTables() {
  const searchParams = useSearchParams();
  const isInner = searchParams.get("table") === "inner";
  const [compact, setCompact] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(390);

  function selectTable(inner: boolean) {
    const url = new URL(window.location.href);
    if (inner) url.searchParams.set("table", "inner");
    else url.searchParams.delete("table");
    if (url.href !== window.location.href) window.history.pushState(null, "", url);
  }

  return (
    <div className={styles.lab}>
      <div className={styles.tableTypes} role="group" aria-label="테이블 구조 선택">
        <Button type="button" variant={isInner ? "outline" : "default"} aria-pressed={!isInner} aria-controls="table-experiments" onClick={() => selectTable(false)}>
          <Table2 aria-hidden="true" />기본 테이블 <span>6</span>
        </Button>
        <Button type="button" variant={isInner ? "default" : "outline"} aria-pressed={isInner} aria-controls="table-experiments" onClick={() => selectTable(true)}>
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
            <Monitor aria-hidden="true" /> 실제 너비
          </Button>
          <Button type="button" variant={compact ? "default" : "ghost"} aria-pressed={compact} onClick={() => setCompact(true)}>
            <Smartphone aria-hidden="true" /> 모바일 모아보기
          </Button>
        </div>
        {compact ? (
          <div className={styles.widthControl}>
            <label htmlFor="preview-width">미리보기 너비</label>
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
      <div
        id="table-experiments"
        className={`${styles.experiments} ${compact ? styles.compact : ""}`}
        style={{ "--preview-width": `${previewWidth}px` } as CSSProperties}
      >
        {isInner ? <InnerTables /> : patterns.map((pattern, index) => <TableExperiment key={pattern.id} pattern={pattern} index={index} />)}
      </div>
      {isInner && <p className="mt-4 text-[11px] leading-6 text-muted-foreground">예시 지표: 달성률 = 완료 ÷ 목표, 거절률 = 거절 ÷ (완료 + 거절). 요일 합계는 시간대별 수치를 합산합니다.</p>}
    </div>
  );
}
