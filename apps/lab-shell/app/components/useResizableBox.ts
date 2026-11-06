"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export type ResizeDirection = "n" | "e" | "s" | "w" | "ne" | "se" | "sw" | "nw";
export type BoxResizeOptions = {
  defaultWidth: number;
  minWidth: number;
  maxWidth?: number;
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
};
type Dimensions = { width: number; height: number };
type Drag = Dimensions & { pointerId: number; x: number; y: number; direction: ResizeDirection };

export default function useResizableBox(options?: BoxResizeOptions) {
  const boxRef = useRef<HTMLElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const [resizing, setResizing] = useState(false);
  const defaultWidth = options?.defaultWidth ?? 390;
  const defaultHeight = options?.defaultHeight ?? 452;
  const [size, setSize] = useState({ defaultWidth, width: defaultWidth, height: defaultHeight });
  const [measurement, setMeasurement] = useState({ width: 0, height: 0, available: 0 });
  const enabled = Boolean(options);

  // The shared width control resets widths without discarding individual heights.
  if (size.defaultWidth !== defaultWidth) setSize({ ...size, defaultWidth, width: defaultWidth });

  const maxWidth = Math.min(options?.maxWidth ?? Infinity, measurement.available || defaultWidth);
  const minWidth = Math.min(options?.minWidth ?? 320, maxWidth);
  const minHeight = options?.minHeight ?? 280;
  const maxHeight = options?.maxHeight ?? 1200;
  const clampWidth = (width: number) => Math.round(Math.max(minWidth, Math.min(maxWidth, width)));
  const clampHeight = (height: number) => Math.round(Math.max(minHeight, Math.min(maxHeight, height)));
  const width = clampWidth(size.defaultWidth === defaultWidth ? size.width : defaultWidth);
  const height = clampHeight(size.height);
  const updateSize = (next: Dimensions) => setSize({ defaultWidth, width: clampWidth(next.width), height: clampHeight(next.height) });

  useEffect(() => {
    const box = boxRef.current;
    const parent = box?.parentElement;
    if (!enabled || !box || !parent) return;
    const observer = new ResizeObserver(() => {
      const rect = box.getBoundingClientRect();
      setMeasurement({ width: Math.round(rect.width), height: Math.round(rect.height), available: parent.clientWidth });
    });
    observer.observe(box);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [enabled]);

  function startResize(event: PointerEvent<HTMLDivElement>, direction: ResizeDirection) {
    if (event.button !== 0 || !event.isPrimary || dragRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.tabIndex >= 0) event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = boxRef.current?.getBoundingClientRect();
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, direction, width: rect?.width ?? width, height: rect?.height ?? height };
    setResizing(true);
  }

  function moveResize(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    updateSize({
      width: drag.width + (drag.direction.includes("e") ? dx : drag.direction.includes("w") ? -dx : 0),
      height: drag.height + (drag.direction.includes("s") ? dy : drag.direction.includes("n") ? -dy : 0),
    });
  }

  function finishResize(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    if (event.type === "pointercancel") updateSize(drag);
    dragRef.current = null;
    setResizing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function resizeWithKeyboard(event: KeyboardEvent<HTMLDivElement>, direction: ResizeDirection) {
    const horizontal = direction === "e";
    const step = event.shiftKey ? 50 : 10;
    const current = horizontal ? measurement.width || width : measurement.height || height;
    const next = event.key === "Home" ? horizontal ? minWidth : minHeight
      : event.key === "End" ? horizontal ? maxWidth : maxHeight
        : event.key === "ArrowRight" || event.key === "ArrowUp" ? current + step
          : event.key === "ArrowLeft" || event.key === "ArrowDown" ? current - step : null;
    if (next === null) return;
    event.preventDefault();
    // Resize keys must not change the surrounding RadioGroup's selection.
    event.stopPropagation();
    updateSize({ width: horizontal ? next : width, height: horizontal ? height : next });
  }

  return {
    boxRef, width, height, resizing, actualWidth: measurement.width || width, actualHeight: measurement.height || height,
    minWidth, maxWidth, minHeight, maxHeight, resetSize: () => updateSize({ width: defaultWidth, height: defaultHeight }),
    getHandleProps: (direction: ResizeDirection) => ({
      onPointerDown: (event: PointerEvent<HTMLDivElement>) => startResize(event, direction),
      onPointerMove: moveResize, onPointerUp: finishResize, onPointerCancel: finishResize,
      onLostPointerCapture: finishResize,
      onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => resizeWithKeyboard(event, direction),
    }),
  };
}
