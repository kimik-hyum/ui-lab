"use client";

import { useEffect, useRef, useState } from "react";
import type { ReadMode, ReadPattern } from "../types";

export function ResponseFrame({ mode, pattern, run }: { mode: ReadMode; pattern: ReadPattern; run: number }) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "timeout" | "invalid">("loading");
  const [height, setHeight] = useState(460);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const src = `/preview-embed/features/nextjs/request-cache/run/${mode}?pattern=${pattern}&run=${run}&attempt=${attempt}`;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let finished = false;
    let observer: ResizeObserver | undefined;
    const fail = (reason: "timeout" | "invalid") => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      setStatus(reason);
    };
    const timer = setTimeout(() => fail("timeout"), 15_000);
    const inspect = () => {
      if (finished) return;
      try {
        const document = frame.contentDocument;
        if (document?.URL === "about:blank") return;
        const main = document?.querySelector<HTMLElement>('[data-request-cache="v1"]');
        if (!main || main.dataset.requestCacheMode !== mode || main.dataset.pattern !== pattern
          || main.querySelectorAll("[data-execution-id]").length !== 3 || !main.querySelector('[data-request-cache-ready="v1"]')) return fail("invalid");
        finished = true;
        clearTimeout(timer);
        const resize = () => setHeight(Math.ceil(main.getBoundingClientRect().height));
        observer = new ResizeObserver(resize);
        observer.observe(main);
        resize();
        setStatus("ready");
      } catch { fail("invalid"); }
    };
    frame.addEventListener("load", inspect);
    if (frame.contentDocument?.readyState === "complete") inspect();
    return () => {
      finished = true;
      clearTimeout(timer);
      observer?.disconnect();
      frame.removeEventListener("load", inspect);
    };
  }, [attempt, mode, pattern, src]);

  const failed = status === "timeout" || status === "invalid";
  return (
    <div className="min-w-0 space-y-3" data-request-cache-frame-state={status}>
      <p role={failed ? "alert" : "status"} className="text-sm leading-6 text-slate-600">
        {status === "ready" ? "서버 결과 확인 완료" : status === "loading" ? "서버 문서를 불러오는 중…"
          : status === "timeout" ? "15초 안에 결과를 받지 못했습니다. 다시 불러와주세요." : "서버 결과를 확인하지 못했습니다. 다시 불러와주세요."}
      </p>
      {failed ? (
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700"
          onClick={() => { setStatus("loading"); setAttempt((value) => value + 1); }}
        >다시 불러오기</button>
      ) : (
        <iframe
          key={attempt}
          ref={frameRef}
          src={src}
          title={mode === "direct" ? "일반 서버 함수 결과" : "React cache 서버 결과"}
          className="block w-full rounded-lg border border-slate-200 bg-white"
          style={{ height }}
        />
      )}
    </div>
  );
}
