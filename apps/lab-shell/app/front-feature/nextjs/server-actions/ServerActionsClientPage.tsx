"use client";

import { useMemo, useState } from "react";
import { ComparisonTemplate } from "../../components/ComparisonTemplate";
import { ComparisonTopicNotes } from "../../components/ComparisonTopicNotes";
import { collectAnchorLines, resolveTopicLines } from "../../components/codeAnchors";
import type { ComparisonTopic } from "../../components/ComparisonTypes";
import { ApiNameForm } from "./components/ApiNameForm";
import { ServerActionNameForm } from "./components/ServerActionNameForm";
import styles from "./server-actions.module.css";

const TOPICS = [
  { id: "transport", title: "요청을 전달하는 책임", description: "왼쪽은 URL·POST·JSON과 Route Handler를 직접 연결합니다. 오른쪽은 실제 Server Action 호출을 Next.js가 전달해 요청 연결 코드의 관리 범위를 줄입니다. 네트워크 요청 자체가 없어지지는 않습니다.", left: [30, 71, 72, 73, 96, 108, 109], right: [18, 45, 50, 51, 52] },
  { id: "server-validation", title: "같은 서버에서 다시 검증", description: "양쪽은 같은 server-only 함수로 공백 정리·길이 검증과 확인번호 생성을 수행합니다. 처리 조건을 같게 유지해 전송 경로의 차이에 집중합니다. 데이터를 영구 저장하지 않습니다.", left: [116, 123, 124, 125, 126, 136], right: [56, 63, 64, 65, 66, 76] },
  { id: "pending-error", title: "대기와 오류를 화면으로 연결", description: "왼쪽은 pending·응답·취소를 직접 관리합니다. 오른쪽은 useActionState로 결과와 대기를 연결해 상태 동기화 부담을 줄이고, 클라이언트 래퍼에서 전송 예외를 처리합니다. 검증 오류는 양쪽 모두 값으로 반환합니다.", left: [13, 14, 17, 69, 81, 82, 83, 85, 86], right: [14, 19, 20, 21, 22, 24] },
  { id: "input-policy", title: "오류 입력 보존과 성공 초기화", description: "왼쪽은 성공일 때만 form.reset을 호출합니다. 오른쪽은 React의 초기화에 맞춰 오류 때 원문을 defaultValue로 돌려줍니다. 두 방식 모두 실패 후 재입력 부담을 줄입니다.", left: [33, 34], right: [35, 36] },
];

export function ServerActionsClientPage({ apiCode, actionCode }: { apiCode: string; actionCode: string }) {
  const [session, setSession] = useState(0);
  const topics = useMemo<ComparisonTopic[]>(() => {
    const left = collectAnchorLines(apiCode);
    const right = collectAnchorLines(actionCode);
    return TOPICS.map((topic) => ({
      id: topic.id, title: topic.title, description: <p>{topic.description}</p>,
      leftLines: resolveTopicLines([topic.id], left, topic.left),
      rightLines: resolveTopicLines([topic.id], right, topic.right),
    }));
  }, [apiCode, actionCode]);

  return <ComparisonTemplate
    title="Server Actions · 서버 검증을 어떻게 연결할까요?"
    description="같은 이름을 실제 서버에서 검증하고 확인번호를 받습니다. 800ms는 대기 상태 관찰용 지연입니다."
    leftTitle="JSON API · fetch + Route Handler" rightTitle="Server Action · useActionState"
    leftCode={apiCode} rightCode={actionCode} topics={topics}
    headerActions={<div className={styles.controls}><button type="button" onClick={() => setSession((value) => value + 1)} className="min-h-11 rounded-full border border-slate-300 px-3 py-2 text-xs text-slate-600">두 폼 초기화</button></div>}
    leftComponent={<ApiNameForm key={`api-${session}`} />}
    rightComponent={<ServerActionNameForm key={`action-${session}`} />}
    footer={<div className="space-y-3 p-6 text-sm leading-relaxed text-slate-500">
      <p>① 공백을 섞은 이름으로 정규화·확인번호 확인 ② 한 글자로 검증 오류 확인 ③ 수정 후 다시 제출. 처리 중에는 입력과 중복 제출을 막고, 성공하면 입력을 비웁니다.</p>
      <p>이름 검증 시연이며 영구 저장·인증·공유 데이터 변경은 없습니다. 확인번호는 서버가 성공한 요청마다 생성하며 성능 수치가 아닙니다.</p>
      <p>코드 전환·초기화는 폼과 결과를 제거합니다. API 수신은 취소해도 서버 처리는 계속될 수 있습니다. Server Action은 이 예제에서 취소하지 않습니다.</p>
      <ComparisonTopicNotes topics={topics} />
      <nav aria-label="공식 문서" className="flex flex-wrap gap-4 text-violet-600 underline">
        <a href="https://nextjs.org/docs/app/guides/forms" target="_blank" rel="noreferrer">Next.js · Server Actions 폼 ↗</a>
        <a href="https://nextjs.org/docs/app/api-reference/file-conventions/route" target="_blank" rel="noreferrer">Next.js · Route Handler ↗</a>
      </nav>
    </div>}
  />;
}
