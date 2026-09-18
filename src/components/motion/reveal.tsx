"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  as?: "div" | "section" | "li" | "article";
  animation?: "fade-up" | "fade-in" | "scale-in" | "slide-left" | "slide-right";
};

export function Reveal({
  children,
  className,
  delayMs = 0,
  as: Tag = "div",
  animation = "fade-up",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cn(
        "reveal-base",
        visible && `reveal-visible reveal-${animation}`,
        className,
      )}
      style={{ "--reveal-delay": `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  stepMs?: number;
  animation?: RevealProps["animation"];
};

export function Stagger({
  children,
  className,
  itemClassName,
  stepMs = 80,
  animation = "fade-up",
}: StaggerProps) {
  return (
    <div className={className}>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) {
          return (
            <Reveal key={index} delayMs={index * stepMs} animation={animation} className={itemClassName}>
              {child}
            </Reveal>
          );
        }

        const element = child as ReactElement<{ className?: string }>;
        return (
          <Reveal
            key={element.key ?? index}
            delayMs={index * stepMs}
            animation={animation}
            className={cn(itemClassName, element.props.className)}
          >
            {cloneElement(element, { className: undefined })}
          </Reveal>
        );
      })}
    </div>
  );
}
