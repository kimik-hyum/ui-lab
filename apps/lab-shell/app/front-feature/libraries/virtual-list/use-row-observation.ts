'use client';

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import type { RowObservation } from "./types";

export function useRowObservation(root: RefObject<HTMLElement | null>): RowObservation | null {
  const [observation, setObservation] = useState<RowObservation | null>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rows = element.querySelectorAll<HTMLElement>("[data-list-row]");
      // Virtuoso may still be preparing its first range after a remount.
      if (rows.length === 0) {
        setObservation(null);
        return;
      }
      const next = {
        count: rows.length,
        first: rows.length ? Number(rows[0].dataset.listRow) : null,
        last: rows.length ? Number(rows[rows.length - 1].dataset.listRow) : null,
      };
      setObservation((previous) => previous?.count === next.count && previous.first === next.first && previous.last === next.last ? previous : next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new MutationObserver(schedule);
    observer.observe(element, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-list-row"] });
    schedule();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [root]);

  return observation;
}
