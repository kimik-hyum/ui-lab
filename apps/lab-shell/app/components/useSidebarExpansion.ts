"use client";

import { useEffect, useRef, useState, type FocusEvent, type PointerEvent } from "react";
import { useSidebarPreference } from "./useSidebarPreference";

export function useSidebarExpansion() {
  const [preference, setPreference] = useSidebarPreference();
  const preferredCollapsed = preference ?? true;
  const [hovered, setHovered] = useState(false);
  const [keyboardFocused, setKeyboardFocused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preview = preferredCollapsed && (hovered || keyboardFocused);
  const collapsed = preferredCollapsed && !preview;

  function cancelTimer() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }

  useEffect(() => {
    function resetPreview() {
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
      setHovered(false);
      setKeyboardFocused(false);
    }
    window.addEventListener("blur", resetPreview);
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
      window.removeEventListener("blur", resetPreview);
    };
  }, []);

  function onPointerEnter(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    cancelTimer();
    timer.current = setTimeout(() => setHovered(true), 100);
  }

  function onPointerLeave() {
    cancelTimer();
    timer.current = setTimeout(() => setHovered(false), 180);
  }

  function onFocusCapture(event: FocusEvent<HTMLElement>) {
    if (event.target.matches(":focus-visible")) setKeyboardFocused(true);
  }

  function onBlurCapture(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocused(false);
  }

  function onPointerDownCapture(event: PointerEvent<HTMLElement>) {
    // Keep the clicked item visible when switching from keyboard to pointer input.
    if (event.pointerType === "mouse" || keyboardFocused) {
      cancelTimer();
      setHovered(true);
    }
    setKeyboardFocused(false);
  }

  function onToggle() {
    cancelTimer();
    setHovered(false);
    setKeyboardFocused(false);
    setPreference(!preferredCollapsed);
  }

  return {
    collapsed,
    preview,
    onToggle,
    toggleLabel: preview ? "사이드 메뉴 펼쳐 두기" : collapsed ? "사이드 메뉴 펼치기" : "사이드 메뉴 접기",
    interactionProps: {
      onPointerEnter,
      onPointerLeave,
      onPointerCancel: onPointerLeave,
      onPointerDownCapture,
      onFocusCapture,
      onBlurCapture,
    },
  };
}
