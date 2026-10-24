"use client";

import { useEffect, useRef, useState } from "react";
import type { ExecutionMode, RenderKind } from "../types";

export function CounterFrame({ kind, execution, run }: {
  kind: RenderKind;
  execution: ExecutionMode;
  run: number;
}) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "timeout" | "invalid">("loading");
  const [height, setHeight] = useState(280);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const src = `/preview-embed/features/nextjs/client-prerender/run/${kind}?run=${run}&attempt=${attempt}`;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let finished = false;
    let mutation: MutationObserver | undefined;
    let resize: ResizeObserver | undefined;
    const fail = (reason: "timeout" | "invalid") => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      mutation?.disconnect();
      resize?.disconnect();
      setStatus(reason);
    };
    const timer = setTimeout(() => fail("timeout"), 15_000);
    const inspect = () => {
      if (finished) return;
      try {
        const document = frame.contentDocument;
        if (document?.URL === "about:blank") return;
        const main = document?.querySelector<HTMLElement>('[data-client-prerender="v1"]');
        if (!main || main.dataset.renderKind !== kind || main.dataset.run !== String(run)
          || !main.querySelector('[data-client-prerender-ready="v1"]')) return fail("invalid");
        const counter = main.querySelector('[data-counter="v1"]');
        const placeholder = main.querySelector('[data-counter-placeholder="v1"]');
        const expectsCounter = execution === "browser" || kind === "prerender";
        if (expectsCounter && !counter) {
          if (execution !== "browser" || kind !== "client-only" || !placeholder) return fail("invalid");
          if (!mutation) {
            mutation = new MutationObserver(inspect);
            mutation.observe(main, { childList: true, subtree: true });
          }
          return;
        }
        const hasCounterControls = counter?.querySelector("[data-counter-value]")
          && counter.querySelector("button[data-counter-increment]");
        if (expectsCounter ? !hasCounterControls : !placeholder || counter) return fail("invalid");
        finished = true;
        clearTimeout(timer);
        mutation?.disconnect();
        const updateHeight = () => setHeight(Math.ceil(main.getBoundingClientRect().height) + 2);
        resize = new ResizeObserver(updateHeight);
        resize.observe(main);
        updateHeight();
        setStatus("ready");
      } catch { fail("invalid"); }
    };
    frame.addEventListener("load", inspect);
    if (frame.contentDocument?.readyState === "complete") inspect();
    return () => {
      finished = true;
      clearTimeout(timer);
      mutation?.disconnect();
      resize?.disconnect();
      frame.removeEventListener("load", inspect);
    };
  }, [attempt, execution, kind, run, src]);

  const failed = status === "timeout" || status === "invalid";
  const showsPlaceholder = execution === "html" && kind === "client-only";
  return (
    <div className="min-w-0 space-y-3" data-client-prerender-frame-state={status} data-execution={execution}>
      <p role={failed ? "alert" : "status"} className="text-sm leading-6 text-slate-600">
        {status === "ready" ? showsPlaceholder ? "대체 표시 확인 · JS 실행 안 함" : "카운터 표시 확인"
          : status === "loading" ? "문서와 카운터 표시를 확인하는 중…"
            : status === "timeout" ? "15초 안에 표시를 확인하지 못했습니다. 다시 불러와주세요."
              : "예상한 문서를 확인하지 못했습니다. 다시 불러와주세요."}
      </p>
      {failed ? (
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700"
          onClick={() => { setStatus("loading"); setAttempt((value) => value + 1); }}
        >
          다시 불러오기
        </button>
      ) : (
        <iframe
          key={`${execution}-${run}-${attempt}`}
          ref={frameRef}
          src={src}
          sandbox={execution === "html" ? "allow-same-origin" : undefined}
          title={`${kind === "prerender" ? "기본 사전 렌더링" : "ssr: false"} · ${execution === "html" ? "서버 HTML만" : "브라우저 실행"}`}
          className="block w-full rounded-lg border border-slate-200 bg-white"
          style={{ height }}
        />
      )}
    </div>
  );
}
