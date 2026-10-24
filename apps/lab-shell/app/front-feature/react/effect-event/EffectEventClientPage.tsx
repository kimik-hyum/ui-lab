'use client';

import { useId, useMemo, useState, useSyncExternalStore } from "react";
import { ComparisonTemplate } from "../../components/ComparisonTemplate";
import { collectAnchorLines, resolveTopicLines } from "../../components/codeAnchors";
import type { ComparisonTopic } from "../../components/ComparisonTypes";
import { createConnectionSource } from "./connection-source";
import type { NotificationTheme, RoomId } from "./connection-source";
import { ReactiveConnection } from "./components/ReactiveConnection";
import { EffectEventConnection } from "./components/EffectEventConnection";

const TOPICS = [
  { id: "connection", title: "연결 조건과 표시 설정을 구분", description: "theme를 의존성에 포함한 Effect는 테마 변경마다 정리·재연결됩니다. Effect Event 구현은 room만 연결 조건으로 남깁니다. 알림 표현을 바꿀 때 불필요한 연결 교체를 줄입니다.", left: [13, 16, 17], right: [16, 17, 19, 20] },
  { id: "latest-value", title: "재연결 없이 최신 값 읽기", description: "useEffectEvent는 이벤트가 도착할 때 최신 렌더의 theme를 읽습니다. 테마를 바꿔도 구독을 유지하면서 새 알림에는 현재 테마가 적용됩니다. 오래된 클로저 문제를 피하기 위한 ref 동기화를 따로 두지 않아도 됩니다.", left: [14], right: [13, 14] },
  { id: "cleanup", title: "필요한 정리는 두 방식 모두 유지", description: "방이 바뀌거나 화면이 사라질 때는 두 구현 모두 구독을 정리합니다. useEffectEvent는 Effect 내부 이벤트용이며, 의존성을 임의로 숨기거나 클릭 핸들러에 직접 쓰는 도구가 아닙니다.", left: [15], right: [18] },
  { id: "notification-policy", title: "받은 알림은 공통 정책으로 보존", description: "두 방식 모두 같은 방에 재연결하면 마지막 알림을 유지하고, 다른 방에 연결하면 비웁니다. 알림 보존은 공통 source의 정책이며 useEffectEvent가 자동으로 제공하는 기능은 아닙니다.", left: [65, 66, 67], right: [68, 69, 70] },
];

export function EffectEventClientPage({ reactiveCode, eventCode }: { reactiveCode: string; eventCode: string }) {
  const [room, setRoom] = useState<RoomId>("design");
  const [theme, setTheme] = useState<NotificationTheme>("light");
  const [message, setMessage] = useState("실험 결과를 함께 확인해주세요.");
  const [leftSource] = useState(createConnectionSource);
  const [rightSource] = useState(createConnectionSource);
  const leftSnapshot = useSyncExternalStore(leftSource.subscribe, leftSource.getSnapshot, leftSource.getServerSnapshot);
  const rightSnapshot = useSyncExternalStore(rightSource.subscribe, rightSource.getSnapshot, rightSource.getServerSnapshot);
  const canSend = leftSnapshot.room === room && rightSnapshot.room === room;
  const connectionStatusId = useId();
  const topics = useMemo<ComparisonTopic[]>(() => {
    const left = collectAnchorLines(reactiveCode);
    const right = collectAnchorLines(eventCode);
    return TOPICS.map((topic) => ({
      id: topic.id, title: topic.title, description: <p>{topic.description}</p>,
      leftLines: resolveTopicLines([topic.id], left, topic.left),
      rightLines: resolveTopicLines([topic.id], right, topic.right),
    }));
  }, [reactiveCode, eventCode]);

  return (
    <ComparisonTemplate
      title="useEffectEvent · 테마를 바꿨는데 왜 다시 연결될까요?"
      description="테마 변경 후 알림을 보내세요. 오른쪽은 연결을 유지하면서도 최신 테마를 읽습니다. 방을 바꾸면 양쪽 모두 재연결됩니다."
      leftTitle="Effect 의존성에 theme 포함" rightTitle="Effect Event로 표시 설정 분리"
      leftCode={reactiveCode} rightCode={eventCode} topics={topics}
      headerActions={
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-2 text-slate-600">방
            <select aria-label="알림 방" value={room} onChange={(event) => setRoom(event.target.value as RoomId)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-700">
              <option value="design">디자인</option><option value="engineering">개발</option>
            </select>
          </label>
          <button type="button" onClick={() => setTheme((value) => value === "light" ? "dark" : "light")} className="min-h-11 rounded-full border border-slate-300 px-3 py-2 text-slate-600">테마: {theme === "light" ? "밝게" : "어둡게"}</button>
          <form className="flex flex-wrap gap-2" onSubmit={(event) => {
            event.preventDefault();
            const text = message.trim();
            if (!text || leftSource.getSnapshot().room !== room || rightSource.getSnapshot().room !== room) return;
            leftSource.send(room, text);
            rightSource.send(room, text);
          }}>
            <input aria-label="보낼 알림" aria-describedby={connectionStatusId} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={80} className="min-h-11 w-48 max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700" />
            <button disabled={!canSend || !message.trim()} aria-describedby={connectionStatusId} type="submit" className="min-h-11 rounded-full bg-violet-600 px-3 py-2 text-white disabled:opacity-50">양쪽에 알림 보내기</button>
          </form>
          <p id={connectionStatusId} role="status" className="w-full text-slate-500">
            {canSend ? "양쪽 연결됨 · 알림을 보낼 수 있습니다." : "알림 전송은 UI 화면에서 양쪽이 연결된 뒤 가능합니다."}
          </p>
        </div>
      }
      leftComponent={<ReactiveConnection source={leftSource} room={room} theme={theme} />}
      rightComponent={<EffectEventConnection source={rightSource} room={room} theme={theme} />}
      footer={<div className="space-y-3 p-6 text-sm leading-relaxed text-slate-500"><p>① 테마만 바꾸면 왼쪽의 연결·정리가 증가 ② 새 알림은 양쪽 모두 현재 테마로 표시 ③ 방을 바꾸면 양쪽 모두 재연결. 같은 방에서는 마지막 알림과 받은 당시의 색을 유지하고, 방을 바꾸면 비웁니다.</p><p>코드 화면에서는 연결을 정리하고 전송을 잠시 막습니다. UI로 돌아오면 다시 보낼 수 있습니다. 연결·정리 횟수에는 이 재마운트와 개발 모드 Strict Mode의 초기 재실행도 포함됩니다. 절대값보다 조작 전후의 증가폭을 보세요.</p><a href="https://react.dev/reference/react/useEffectEvent" target="_blank" rel="noreferrer" className="inline-block text-violet-600 underline">useEffectEvent 공식 문서 ↗</a></div>}
    />
  );
}
