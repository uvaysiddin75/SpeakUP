"use client";

import { ClipboardCheck, Compass, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal, Stagger } from "@/components/motion/reveal";

const steps = [
  { key: "choose", icon: Compass },
  { key: "practice", icon: ClipboardCheck },
  { key: "grow", icon: Rocket },
] as const;

export function HowItWorksSection() {
  const t = useTranslations("home");

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t("howTitle")}
        </h2>
        <p className="mt-3 text-muted-foreground">{t("howSubtitle")}</p>
      </Reveal>

      <Stagger className="mt-10 grid gap-4 md:grid-cols-3" stepMs={120}>
        {steps.map(({ key, icon: Icon }, index) => (
          <article
            key={key}
            className="relative overflow-hidden rounded-[1.35rem] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[var(--shadow-hover)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="inline-flex rounded-xl bg-primary/10 p-2.5 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <span className="font-display text-3xl font-bold text-muted/80">0{index + 1}</span>
            </div>
            <h3 className="font-display text-xl font-semibold">{t(`how.${key}.title`)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(`how.${key}.description`)}
            </p>
          </article>
        ))}
      </Stagger>
    </section>
  );
}
