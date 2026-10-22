"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function HtmlSnapshot({ html, css, label }: { html: string; css: string; label: string }) {
  const [height, setHeight] = useState(440);
  const observer = useRef<ResizeObserver | null>(null);
  useEffect(() => () => observer.current?.disconnect(), []);
  const document = useMemo(() => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><style>html,body{margin:0;padding:0;background:#181816}${css}</style></head><body>${html}</body></html>`, [html, css]);

  return <div className="overflow-hidden rounded-lg border border-slate-200"><iframe
    title={`${label}가 반환한 서버 HTML`}
    srcDoc={document}
    sandbox="allow-same-origin"
    className="block w-full border-0 bg-white"
    style={{ height }}
    onLoad={(event) => {
      observer.current?.disconnect();
      const main = event.currentTarget.contentDocument?.querySelector("[data-dashboard-ssr]");
      if (!main) return;
      const updateHeight = () => setHeight(Math.max(1, Math.ceil(main.getBoundingClientRect().height)));
      observer.current = new ResizeObserver(updateHeight);
      observer.current.observe(main);
      updateHeight();
    }}
  /></div>;
}
