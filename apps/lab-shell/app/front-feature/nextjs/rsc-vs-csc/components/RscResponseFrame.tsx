"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function RscResponseFrame({ delay, run }: { delay: number; run: number }) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "complete" | "timeout" | "invalid">("loading");
  const frameRef = useRef<HTMLIFrameElement>(null);
  const src = `/preview-embed/features/nextjs/rsc-vs-csc/run/rsc?delay=${delay}&run=${run}&attempt=${attempt}`;

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
        const expectedUrl = new URL(src, window.location.href);
        if (!document || new URL(document.URL).href !== expectedUrl.href) return finish("invalid");
        const main = document.querySelector<HTMLElement>('main[data-article-source="server"]');
        const article = main?.querySelector('article[data-article-id="rendering-guide"]');
        finish(main?.dataset.serverDelay === String(delay) && article ? "complete" : "invalid");
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
  }, [attempt, delay, run, src]);

  const failed = status === "timeout" || status === "invalid";

  return (
    <div className="min-w-0 space-y-3" data-rsc-frame-state={status} data-rsc-attempt={attempt} data-rsc-delay={delay}>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
        <p role={failed ? "alert" : "status"}>
          {status === "loading" ? "HTML 문서 요청 중" : status === "complete" ? "본문 포함 문서 확인 완료"
            : status === "timeout" ? "15초 안에 본문을 확인하지 못했습니다. 오른쪽 응답을 다시 불러와주세요."
              : "예상한 응답 문서와 본문을 확인하지 못했습니다. 다시 불러와주세요."}
        </p>
        <Link href={src} prefetch={false} target="_blank" className="underline underline-offset-4">응답 새 탭에서 보기 ↗</Link>
      </div>
      {failed ? (
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700"
          onClick={() => { setStatus("loading"); setAttempt((value) => value + 1); }}
        >
          오른쪽만 다시 불러오기
        </button>
      ) : (
        <iframe
          key={attempt}
          ref={frameRef}
          src={src}
          title="실제 Server Component 아티클 응답"
          loading="eager"
          className="h-[560px] w-full rounded-lg border border-slate-200 bg-white"
        />
      )}
      <p className="text-xs leading-5 text-slate-500">15초 제한은 문서 관찰 대기를 끝내는 기준입니다. 서버 작업의 취소나 렌더링 시간 측정을 뜻하지 않습니다. 오른쪽 재시도는 지연 조건과 왼쪽 결과를 유지합니다.</p>
    </div>
  );
}
