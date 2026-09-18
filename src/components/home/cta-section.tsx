"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  const t = useTranslations("home");

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal animation="scale-in">
        <div className="speakup-hero-panel relative overflow-hidden rounded-[1.75rem] px-6 py-12 text-center text-white sm:px-10">
          <div
            className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-orange-400/25 blur-3xl animate-float-soft"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-8 bottom-0 h-44 w-44 rounded-full bg-white/10 blur-3xl animate-float-delayed"
            aria-hidden
          />
          <h2 className="relative font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("ctaTitle")}
          </h2>
          <p className="relative mx-auto mt-3 max-w-2xl text-teal-50/90">{t("ctaSubtitle")}</p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="accent">
              <Link href="/dashboard">{t("openApp")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/courses">{t("exploreCourses")}</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
