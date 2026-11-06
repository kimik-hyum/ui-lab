"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { completeSurveySignIn } from "@/app/lib/survey-client";
import { DEFAULT_SURVEY_PATH } from "@/app/lib/survey-auth-state";

export default function AuthCallbackPage() {
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    completeSurveySignIn().then((path) => {
      if (active) window.location.replace(path);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "로그인을 완료하지 못했어요.");
    });
    return () => { active = false; };
  }, []);
  return (
    <main className="workspace-page flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
      <h1 className="text-xl font-bold">{error ? "로그인을 다시 시작해주세요" : "로그인을 확인하고 있어요"}</h1>
      <p role={error ? "alert" : "status"} className="max-w-md text-sm leading-7 text-muted-foreground">
        {error || "로그인이 완료되면 선택한 UI의 사유를 작성하는 화면으로 돌아갑니다."}
      </p>
      {error && <Link className="text-sm font-medium text-primary underline underline-offset-4" href={DEFAULT_SURVEY_PATH}>설문으로 돌아가기</Link>}
    </main>
  );
}
