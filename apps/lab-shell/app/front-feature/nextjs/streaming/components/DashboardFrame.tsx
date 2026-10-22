"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { DashboardDelay, DashboardMode } from "../types";

export default function DashboardFrame({
  mode,
  delay,
  run,
}: {
  mode: DashboardMode;
  delay: DashboardDelay;
  run: number;
}) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "complete" | "timeout" | "invalid">("loading");
  const frameRef = useRef<HTMLIFrameElement>(null);
  const src = `/preview-embed/features/nextjs/streaming/run/${mode}?delay=${delay.summaryMs}&run=${run}&attempt=${attempt}`;
  const title = mode === "blocking" ? "일괄 SSR 대시보드" : "Suspense 스트리밍 대시보드";

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let finished = false;
    let observer: MutationObserver | undefined;
    const finish = (next: "complete" | "timeout" | "invalid") => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      observer?.disconnect();
      setStatus(next);
    };
    const timer = setTimeout(() => finish("timeout"), 15_000);
    const inspect = () => {
      if (finished) return;
      try {
        const document = frame.contentDocument;
        if (document?.URL === "about:blank") return;
        if (!document || new URL(document.URL).href !== new URL(src, window.location.href).href) {
          return finish("invalid");
        }
        const main = document.querySelector(`main[data-stream-stage="shell"][data-stream-mode="${mode}"]`);
        if (!main?.querySelector("h1")) return finish("invalid");
        if (main.querySelector('[data-stream-stage="summary"]') && main.querySelector('[data-stream-stage="activity"]')) {
          return finish("complete");
        }
        // load 이후 남은 Suspense 영역의 DOM 교체도 기다립니다.
        if (!observer) {
          observer = new MutationObserver(inspect);
          observer.observe(main, { childList: true, subtree: true });
        }
      } catch { finish("invalid"); }
    };
    frame.addEventListener("load", inspect);
    try {
      if (frame.contentDocument?.readyState === "complete") inspect();
    } catch { finish("invalid"); }
    return () => {
      finished = true;
      clearTimeout(timer);
      observer?.disconnect();
      frame.removeEventListener("load", inspect);
    };
  }, [attempt, mode, run, src]);

  const failed = status === "timeout" || status === "invalid";

  return (
    <div className="min-w-0 space-y-3" data-stream-frame-state={status} data-stream-attempt={attempt}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <p role={failed ? "alert" : "status"}>
          {status === "loading" ? "문서 요청 중 · 도착한 내용부터 표시"
            : status === "complete" ? "헤더·요약·활동 본문 확인 완료"
              : status === "timeout" ? "15초 안에 본문을 모두 확인하지 못했습니다."
                : "예상한 응답 문서와 본문을 확인하지 못했습니다."}
        </p>
        <Link href={src} prefetch={false} target="_blank" className="underline underline-offset-4">
          이 응답만 새 탭에서 보기 ↗
        </Link>
      </div>
      {failed ? (
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700"
          onClick={() => { setStatus("loading"); setAttempt((value) => value + 1); }}
        >
          이 응답 다시 불러오기
        </button>
      ) : (
        <iframe
          key={attempt}
          ref={frameRef}
          src={src}
          title={title}
          loading="eager"
          className="h-[700px] w-full rounded-lg border border-slate-200 bg-[#181816]"
        />
      )}
      <p className="text-xs leading-5 text-slate-500">
        도착 중인 HTML은 계속 표시합니다. 완료는 본문 확인을 뜻하며 표시 시각이나 성능 점수가 아닙니다.
        15초는 관찰 대기 제한으로, 서버 작업 취소를 뜻하지 않습니다. 재시도는 이 응답만 다시 불러옵니다.
      </p>
    </div>
  );
}
