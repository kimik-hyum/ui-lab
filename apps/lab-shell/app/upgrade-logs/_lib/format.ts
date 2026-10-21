import type { CodeSnapshot } from "./types";

export function formatCodeRange(snapshot: CodeSnapshot) {
  const count = snapshot.code.replace(/\r?\n$/, "").split(/\r?\n/).length;
  return count === 1 ? `L${snapshot.startLine}` : `L${snapshot.startLine}–${snapshot.startLine + count - 1}`;
}

export function formatLogDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric",
  }).format(new Date(value));
}
