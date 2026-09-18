"use client";

import { BookOpen, Layers3, Route, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal, Stagger } from "@/components/motion/reveal";

const stats = [
  { key: "lessons", icon: BookOpen, value: "500+" },
  { key: "levels", icon: Layers3, value: "6" },
  { key: "skills", icon: Target, value: "6" },
  { key: "path", icon: Route, value: "A1→C2" },
] as const;

export function StatsSection() {
  const t = useTranslations("home");

  return (
    <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
      <Reveal>
        <div className="rounded-[1.5rem] border border-border bg-card/80 p-4 shadow-sm backdrop-blur sm:p-6">
          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" stepMs={90}>
            {stats.map(({ key, icon: Icon, value }) => (
              <div
                key={key}
                className="flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-4 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold tracking-tight animate-count-pop">
                    {value}
                  </p>
                  <p className="text-sm text-muted-foreground">{t(`stats.${key}`)}</p>
                </div>
              </div>
            ))}
          </Stagger>
        </div>
      </Reveal>
    </section>
  );
}
