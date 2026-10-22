'use client';

import { useEffect, useEffectEvent, useSyncExternalStore } from "react";
import type { ConnectionSource, NotificationTheme, RoomId } from "../connection-source";
import { ConnectionPanel } from "./ConnectionPanel";

export function EffectEventConnection({ source, room, theme }: {
  source: ConnectionSource; room: RoomId; theme: NotificationTheme;
}) {
  const snapshot = useSyncExternalStore(source.subscribe, source.getSnapshot, source.getServerSnapshot);

  // [cmp:latest-value:start]
  const onMessage = useEffectEvent((text: string) => ({ text, theme }));
  // 이벤트가 도착하는 시점의 최신 theme를 읽습니다.
  // [cmp:latest-value:end]

  // [cmp:connection:start]
  useEffect(() => {
    const disconnect = source.connect(room, (text) => onMessage(text));
    // [cmp:connection:end]
    // [cmp:cleanup:start]
    return disconnect;
    // [cmp:cleanup:end]
    // [cmp:connection:start]
  }, [source, room]);
  // room은 연결 대상이므로 의존성에 남기고 Effect Event는 넣지 않습니다.
  // [cmp:connection:end]

  return <ConnectionPanel snapshot={snapshot} />;
}
