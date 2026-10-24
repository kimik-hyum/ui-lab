"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "cn";

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const createTooltipHandle = TooltipPrimitive.createHandle;

export function TooltipContent({ className, children, ...props }: TooltipPrimitive.Popup.Props) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner side="top" align="start" sideOffset={8} collisionPadding={12} className="z-50 max-w-[calc(100vw-24px)] data-anchor-hidden:hidden">
        <TooltipPrimitive.Popup
          role="tooltip"
          className={cn("max-h-[min(20rem,var(--available-height))] max-w-sm overflow-y-auto rounded-lg border border-border bg-white px-4 py-3 text-xs leading-5 text-foreground shadow-lg", className)}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}
