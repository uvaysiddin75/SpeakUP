"use client";

import { useEffect, useRef } from "react";

/**
 * Tracks meaningful learning time while the page is visible.
 * Does not count idle background tabs (uses visibility + heartbeat end).
 */
export function LearningSessionTracker({
  kind,
  entityId,
}: {
  kind: string;
  entityId?: string;
}) {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "session_start",
            kind,
            entityId,
          }),
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { sessionId?: string };
        sessionIdRef.current = data.sessionId ?? null;
      } catch {
        // guest / offline
      }
    };

    const end = () => {
      const id = sessionIdRef.current;
      if (!id) return;
      sessionIdRef.current = null;
      const body = JSON.stringify({ action: "session_end", sessionId: id });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/progress",
          new Blob([body], { type: "application/json" }),
        );
      } else {
        void fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        });
      }
    };

    void start();

    const onVisibility = () => {
      if (document.visibilityState === "hidden") end();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", end);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", end);
      end();
    };
  }, [kind, entityId]);

  return null;
}
