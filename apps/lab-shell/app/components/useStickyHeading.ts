"use client";

import { useEffect, useRef, useState } from "react";

export default function useStickyHeading() {
  const [stuck, setStuck] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    const card = header?.parentElement;
    if (!header || !card) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const restingTop = card.getBoundingClientRect().top + card.clientTop;
      setStuck(header.getBoundingClientRect().top > restingTop + 0.5);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(document.documentElement);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return { headerRef, stuck };
}
