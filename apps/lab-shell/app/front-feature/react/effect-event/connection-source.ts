export type NotificationTheme = "light" | "dark";
export type RoomId = "design" | "engineering";

export interface Notification {
  text: string;
  theme: NotificationTheme;
}

export interface ConnectionSnapshot {
  connections: number;
  disconnections: number;
  received: number;
  room: RoomId | null;
  notification: Notification | null;
}

const INITIAL_SNAPSHOT: ConnectionSnapshot = {
  connections: 0, disconnections: 0, received: 0, room: null, notification: null,
};

// 실제 외부 서버 대신 같은 브라우저의 이벤트 구독을 사용합니다.
// 연결/정리 횟수는 Effect가 호출한 실제 subscribe/unsubscribe 횟수입니다.
export function createConnectionSource() {
  let snapshot = INITIAL_SNAPSHOT;
  let lastRoom: RoomId | null = null;
  const observers = new Set<() => void>();
  const listeners = new Set<{ room: RoomId; receive: (text: string) => Notification }>();
  const publish = (next: ConnectionSnapshot) => {
    snapshot = next;
    observers.forEach((notify) => notify());
  };

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => INITIAL_SNAPSHOT,
    subscribe: (notify: () => void) => {
      observers.add(notify);
      return () => { observers.delete(notify); };
    },
    connect(room: RoomId, receive: (text: string) => Notification) {
      const listener = { room, receive };
      listeners.add(listener);
      // [cmp:notification-policy:start]
      const notification = lastRoom === room ? snapshot.notification : null;
      lastRoom = room;
      publish({ ...snapshot, connections: snapshot.connections + 1, room, notification });
      // [cmp:notification-policy:end]
      return () => {
        if (!listeners.delete(listener)) return;
        publish({ ...snapshot, disconnections: snapshot.disconnections + 1, room: null });
      };
    },
    send(room: RoomId, text: string) {
      listeners.forEach((listener) => {
        if (listener.room !== room) return;
        const notification = listener.receive(text);
        publish({ ...snapshot, received: snapshot.received + 1, notification });
      });
    },
  };
}

export type ConnectionSource = ReturnType<typeof createConnectionSource>;
