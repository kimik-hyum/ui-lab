import "server-only";
import { setTimeout as wait } from "node:timers/promises";
import type { DashboardActivity, DashboardSummary } from "./types";

// 양쪽 모두 같은 고정 데이터를 사용하며, 화면을 공개하는 경계만 다릅니다.
const SUMMARY: DashboardSummary = [
  { label: "진행 중", value: "8", caption: "이번 주 작업" },
  { label: "검토 대기", value: "3", caption: "팀 피드백 필요" },
  { label: "완료", value: "12", caption: "최근 완료한 작업" },
];

const ACTIVITY: DashboardActivity = [
  { id: "design", project: "디자인 시스템", title: "공통 카드와 간격 정리", status: "검토 대기" },
  { id: "docs", project: "문서", title: "설치 가이드 업데이트", status: "완료" },
  { id: "accessibility", project: "접근성", title: "키보드 탐색 개선", status: "진행 중" },
];

export async function loadDashboardSummary(delayMs: number): Promise<DashboardSummary> {
  // 관찰을 위한 서버 I/O 인공지연이며, 실제 서비스 성능을 나타내지 않습니다.
  await wait(delayMs);
  return SUMMARY;
}

export async function loadDashboardActivity(delayMs: number): Promise<DashboardActivity> {
  await wait(delayMs);
  return ACTIVITY;
}
