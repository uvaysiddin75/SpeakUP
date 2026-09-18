"use client";

import { useEffect, useState } from "react";
import { Award, CheckCircle2, Flame, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "achievement" | "streak" | "info";

export type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
  icon: "success" | "error" | "achievement" | "streak" | "info";
  durationMs: number;
};

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  achievement: Award,
  streak: Flame,
  info: Info,
} as const;

const TONE_CLASS: Record<ToastTone, string> = {
  success: "border-success/30 bg-card text-foreground",
  error: "border-danger/30 bg-card text-foreground",
  achievement: "border-primary/35 bg-card text-foreground achievement-glow",
  streak: "border-accent/35 bg-card text-foreground",
  info: "border-border bg-card text-foreground",
};

const ICON_CLASS: Record<ToastTone, string> = {
  success: "text-success",
  error: "text-danger",
  achievement: "text-primary",
  streak: "text-accent",
  info: "text-muted-foreground",
};

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const Icon = ICONS[toast.icon];

  useEffect(() => {
    const leaveAt = window.setTimeout(() => setLeaving(true), toast.durationMs);
    const removeAt = window.setTimeout(
      () => onDismiss(toast.id),
      toast.durationMs + 280,
    );
    return () => {
      window.clearTimeout(leaveAt);
      window.clearTimeout(removeAt);
    };
  }, [toast.id, toast.durationMs, onDismiss]);

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-3.5 shadow-[var(--shadow-hover)] transition-all duration-300",
        TONE_CLASS[toast.tone],
        leaving ? "translate-y-2 opacity-0" : "animate-toast-in",
      )}
      role="status"
    >
      <span
        className={cn(
          "mt-0.5 rounded-xl bg-muted/70 p-2",
          ICON_CLASS[toast.tone],
          toast.tone === "achievement" && "animate-scale-in",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
