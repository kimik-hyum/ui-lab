"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import { Button } from "@/components/ui/button";

const stroke = 4;
const gap = 6;
const pitch = stroke + gap;
const markSize = stroke * 3 + gap * 2;
const strokeLength = 22;
const lengthInset = (markSize - strokeLength) / 2;
const spring = { stiffness: 420, damping: 32, mass: 0.8 };

export default function SidebarBrand({
  collapsed,
  onToggle,
  onNavigate,
  controls,
  label = collapsed ? "사이드 메뉴 펼치기" : "사이드 메뉴 접기",
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  controls: string;
  label?: string;
}) {
  const reducedMotion = useReducedMotion();
  const rotation = useSpring(collapsed ? 90 : 0, spring);
  // Tie the connector to the actual angle so interrupted turns reverse smoothly.
  const connectorOpacity = useTransform(rotation, [20, 55], [1, 0]);

  useEffect(() => {
    const angle = collapsed ? 90 : 0;
    if (reducedMotion) rotation.jump(angle);
    else rotation.set(angle);
  }, [collapsed, reducedMotion, rotation]);

  return (
    <div className="sidebar-brand flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="sidebar-logo-toggle relative h-10 w-10 rounded-[11px] border-0 bg-transparent p-0 hover:bg-white/10 aria-expanded:bg-transparent dark:hover:bg-white/10"
        onClick={onToggle}
        aria-label={label}
        aria-expanded={!collapsed}
        aria-controls={controls}
        title={label}
      >
        <motion.div
          aria-hidden="true"
          className="sidebar-logo-tile absolute inset-0 grid place-items-center rounded-[inherit] text-white"
          initial={false}
          animate={{ backgroundColor: collapsed ? "rgba(37, 99, 235, 0)" : "rgba(37, 99, 235, 1)" }}
          transition={{ duration: reducedMotion ? 0 : 0.25 }}
        >
          <motion.div className="relative" style={{ width: markSize, height: markSize, rotate: rotation }}>
            <motion.div
              className="absolute left-0 bg-current"
              style={{
                top: lengthInset + strokeLength - stroke,
                width: pitch + stroke,
                height: stroke,
                opacity: connectorOpacity,
              }}
            />
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="absolute bg-current"
                style={{ left: index * pitch, top: lengthInset, width: stroke, height: strokeLength }}
              />
            ))}
          </motion.div>
        </motion.div>
      </Button>
      <motion.span
        className="sidebar-wordmark whitespace-nowrap text-[28px] leading-none font-semibold tracking-[-0.04em] text-blue-200"
        aria-hidden={collapsed}
        inert={collapsed}
        initial={false}
        animate={{ opacity: collapsed ? 0 : 1, x: collapsed ? -8 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.18, delay: reducedMotion || collapsed ? 0 : 0.12 }}
      >
        <Link
          href="/"
          onClick={onNavigate}
          aria-label="UI Lab 홈으로 이동"
          title="홈으로 이동"
          className="rounded-sm transition-colors hover:text-white focus-visible:text-white"
        >
          Lab
        </Link>
      </motion.span>
    </div>
  );
}
