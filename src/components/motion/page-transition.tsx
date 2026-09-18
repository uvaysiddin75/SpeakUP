"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Fast page enter transition (fade + slight slide/scale).
 * Respects prefers-reduced-motion via CSS.
 */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const id = requestAnimationFrame(() => {
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div
      key={pathname}
      className={cn(
        "page-transition",
        ready && "page-transition-ready",
        className,
      )}
    >
      {children}
    </div>
  );
}
