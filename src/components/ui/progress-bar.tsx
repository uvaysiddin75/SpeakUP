"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  label?: string;
  showValue?: boolean;
  tone?: "primary" | "success" | "warning" | "danger";
  /** Animate fill from 0 on mount / value change */
  animated?: boolean;
}

const tones = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
} as const;

export function ProgressBar({
  value,
  className,
  label,
  showValue = true,
  tone = "primary",
  animated = true,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const [display, setDisplay] = useState(animated ? 0 : clamped);
  const [completeFlash, setCompleteFlash] = useState(false);

  useEffect(() => {
    if (!animated) {
      setDisplay(clamped);
      return;
    }
    const id = requestAnimationFrame(() => setDisplay(clamped));
    return () => cancelAnimationFrame(id);
  }, [clamped, animated]);

  useEffect(() => {
    if (clamped < 100) {
      setCompleteFlash(false);
      return;
    }
    setCompleteFlash(true);
    const t = window.setTimeout(() => setCompleteFlash(false), 900);
    return () => window.clearTimeout(t);
  }, [clamped]);

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
          {label ? <span>{label}</span> : <span />}
          <span className="inline-flex items-center gap-1 tabular-nums">
            {showValue ? <span>{Math.round(display)}%</span> : null}
            {clamped >= 100 ? (
              <Check
                className={cn(
                  "h-3.5 w-3.5 text-success",
                  completeFlash && "animate-check-pop",
                )}
                aria-label="Complete"
              />
            ) : null}
          </span>
        </div>
      )}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            tones[tone],
            clamped >= 100 && "bg-success",
          )}
          style={{ width: `${display}%` }}
        />
      </div>
    </div>
  );
}
