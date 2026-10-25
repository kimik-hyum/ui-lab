"use client";

import { useCallback, useEffect, useRef, type PointerEvent } from "react";
import { useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

const spring = { stiffness: 520, damping: 42, mass: 0.8 };

export function useSidebarHover() {
  const ref = useRef<HTMLElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const hoveredItem = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const x = useSpring("100%", spring);
  const y = useSpring(0, spring);
  const height = useMotionValue(0);
  const contentX = useTransform(x, (value) => `${-parseFloat(value)}%`);
  const contentY = useTransform(y, (value) => -value);

  const hide = useCallback(() => {
    hoveredItem.current = null;
    if (reducedMotion) x.jump("100%");
    else x.set("100%");
  }, [reducedMotion, x]);

  const clear = useCallback(() => {
    pointer.current = null;
    hide();
  }, [hide]);

  const follow = useCallback((item: HTMLElement) => {
    const nav = ref.current;
    if (!nav) return;
    const bounds = item.getBoundingClientRect();
    const top = bounds.top - nav.getBoundingClientRect().top;

    // A fresh entrance starts beside its row. Interrupted motion keeps its position.
    if (reducedMotion || parseFloat(x.get()) >= 99.9) y.jump(top);
    else y.set(top);
    height.set(bounds.height);
    if (reducedMotion) x.jump("0%");
    else x.set("0%");
    hoveredItem.current = item;
  }, [height, reducedMotion, x, y]);

  const syncPointer = useCallback(() => {
    const position = pointer.current;
    if (!position) return;
    const item = document.elementFromPoint(position.x, position.y)
      ?.closest<HTMLElement>("[data-sidebar-item]");
    if (item && ref.current?.contains(item)) follow(item);
    else hide();
  }, [follow, hide]);

  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const observer = new ResizeObserver(syncPointer);
    observer.observe(nav);
    const scroller = nav.parentElement;
    scroller?.addEventListener("scroll", syncPointer, { passive: true });
    window.addEventListener("blur", clear);
    return () => {
      observer.disconnect();
      scroller?.removeEventListener("scroll", syncPointer);
      window.removeEventListener("blur", clear);
    };
  }, [clear, syncPointer]);

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    pointer.current = { x: event.clientX, y: event.clientY };
    const item = event.target instanceof Element
      ? event.target.closest<HTMLElement>("[data-sidebar-item]")
      : null;
    if (item && item !== hoveredItem.current && ref.current?.contains(item)) follow(item);
  }

  return {
    ref,
    onPointerMove,
    onPointerLeave: clear,
    onPointerCancel: clear,
    style: { x, y, height },
    contentStyle: { x: contentX, y: contentY },
  };
}
