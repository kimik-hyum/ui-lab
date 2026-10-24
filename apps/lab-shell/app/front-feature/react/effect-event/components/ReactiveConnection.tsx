'use client';

import { useEffect, useSyncExternalStore } from "react";
import type { ConnectionSource, NotificationTheme, RoomId } from "../connection-source";
import { ConnectionPanel } from "./ConnectionPanel";

export function ReactiveConnection({ source, room, theme }: {
  source: ConnectionSource; room: RoomId; theme: NotificationTheme;
}) {
  const snapshot = useSyncExternalStore(source.subscribe, source.getSnapshot, source.getServerSnapshot);

  // [cmp:connection:start]
  useEffect(() => {
    // [cmp:connection:end]
    // [cmp:latest-value:start]
    const disconnect = source.connect(room, (text) => ({ text, theme }));
    // [cmp:latest-value:end]
    // [cmp:cleanup:start]
    return disconnect;
    // [cmp:cleanup:end]
    // [cmp:connection:start]
  }, [source, room, theme]);
  // theme를 읽으므로 의존성에 포함합니다. 변경하면 구독을 다시 연결합니다.
  // [cmp:connection:end]

  return <ConnectionPanel snapshot={snapshot} />;
}
