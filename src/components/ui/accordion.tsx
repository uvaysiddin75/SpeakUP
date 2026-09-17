"use client";

import { ChevronDown } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  openItems: Set<string>;
  toggle: (value: string) => void;
  type: "single" | "multiple";
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within Accordion");
  }
  return context;
}

interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  defaultValue?: string[];
  children: ReactNode;
}

export function Accordion({
  type = "multiple",
  defaultValue = [],
  className,
  children,
  ...props
}: AccordionProps) {
  const [openItems, setOpenItems] = useState(() => new Set(defaultValue));

  const toggle = useCallback(
    (value: string) => {
      setOpenItems((prev) => {
        const next = new Set(prev);
        if (next.has(value)) {
          next.delete(value);
        } else if (type === "single") {
          return new Set([value]);
        } else {
          next.add(value);
        }
        return next;
      });
    },
    [type],
  );

  const value = useMemo(
    () => ({ openItems, toggle, type }),
    [openItems, toggle, type],
  );

  return (
    <AccordionContext.Provider value={value}>
      <div className={cn("space-y-2", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children: ReactNode;
}

export function AccordionItem({
  value,
  className,
  children,
  ...props
}: AccordionItemProps) {
  return (
    <div
      data-state={value}
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface AccordionTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  children: ReactNode;
}

export function AccordionTrigger({
  value,
  className,
  children,
  ...props
}: AccordionTriggerProps) {
  const { openItems, toggle } = useAccordionContext();
  const isOpen = openItems.has(value);
  const triggerId = useId();

  return (
    <button
      id={triggerId}
      type="button"
      aria-expanded={isOpen}
      onClick={() => toggle(value)}
      className={cn(
        "flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
      <ChevronDown
        className={cn(
          "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180",
        )}
        aria-hidden
      />
    </button>
  );
}

interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children: ReactNode;
}

export function AccordionContent({
  value,
  className,
  children,
  ...props
}: AccordionContentProps) {
  const { openItems } = useAccordionContext();
  const isOpen = openItems.has(value);

  if (!isOpen) return null;

  return (
    <div
      className={cn("border-t border-border px-5 py-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}
