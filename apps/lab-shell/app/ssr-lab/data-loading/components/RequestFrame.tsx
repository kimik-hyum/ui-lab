"use client";

import { useEffect, useRef, useState } from "react";

export function RequestFrame({ mode, delayMs, run }: { mode: "sequential" | "parallel"; delayMs: number; run: number }) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "complete" | "timeout" | "invalid">("loading");
  const frameRef = useRef<HTMLIFrameElement>(null);
  const src = `/preview-embed/ssr/data-loading/${mode}?delay=${delayMs}&run=${run}&attempt=${attempt}`;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let finished = false;
    const finish = (next: "complete" | "timeout" | "invalid") => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
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
        const main = document.querySelector<HTMLElement>(`main[data-loading-mode="${mode}"]`);
        const summary = main?.querySelector('[data-task="팀 요약"][data-task-start][data-task-end]');
        const activity = main?.querySelector('[data-task="최근 활동"][data-task-start][data-task-end]');
        finish(main?.querySelector("h1") && main.querySelector("[data-server-elapsed]") && summary && activity ? "complete" : "invalid");
      } catch { finish("invalid"); }
    };
    frame.addEventListener("load", inspect);
    try {
      if (frame.contentDocument?.readyState === "complete") inspect();
    } catch { finish("invalid"); }
    return () => {
      finished = true;
      clearTimeout(timer);
      frame.removeEventListener("load", inspect);
    };
  }, [attempt, delayMs, mode, run, src]);

  const failed = status === "timeout" || status === "invalid";
  return (
    <div className="min-w-0 space-y-3" data-loading-frame-state={status} data-loading-attempt={attempt}>
      <p className="text-xs text-slate-500" role={failed ? "alert" : "status"}>
        {status === "loading" ? "서버에서 두 데이터를 준비하고 있습니다…"
          : status === "complete" ? "서버 작업 본문 확인 완료"
            : status === "timeout" ? "15초 안에 본문을 확인하지 못했습니다."
              : "예상한 응답 문서와 본문을 확인하지 못했습니다."}
      </p>
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
          title={mode === "sequential" ? "순차 SSR 응답" : "동시 SSR 응답"}
          src={src}
          loading="eager"
          className="block h-[600px] w-full rounded-lg border border-slate-200 bg-[#181816] xl:h-[540px]"
        />
      )}
      <p className="text-xs leading-5 text-slate-500">15초는 문서 확인 대기 제한입니다. 서버 작업 취소나 화면 표시 시간 측정이 아닙니다. 재시도는 이 응답만 다시 불러옵니다.</p>
    </div>
  );
}
