"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = TooltipPrimitive.Content;

const TooltipComponent = React.forwardRef<
  React.ElementRef<typeof TooltipTrigger>,
  React.ComponentPropsWithoutRef<typeof TooltipTrigger> & {
    content: string;
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
    sideOffset?: number;
  }
>(
  (
    {
      className,
      children,
      content,
      side = "top",
      align = "center",
      sideOffset = 8,
      ...props
    },
    ref
  ) => {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild ref={ref} {...props}>
            {children}
          </TooltipTrigger>
          <TooltipContent
            side={side}
            align={align}
            sideOffset={sideOffset}
            className={cn(
              "z-[100] max-w-xs rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-lg",
              "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              className
            )}
            {...props}
          >
            <p className="leading-relaxed">{content}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

TooltipComponent.displayName = "TooltipComponent";

export { TooltipComponent as Tooltip };
