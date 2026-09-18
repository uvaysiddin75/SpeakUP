"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, BookOpenCheck, Flame, Mic, Sparkles, Trophy } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

const pathItems = [
  { labelKey: "pathGrammar" as const, valueKey: "pathGrammarValue" as const },
  { labelKey: "pathSkills" as const, valueKey: "pathSkillsValue" as const },
  { labelKey: "pathSpeaking" as const, valueKey: "pathSpeakingValue" as const },
];

export function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="relative overflow-hidden">
      <div className="speakup-grid absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl animate-float-soft"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl animate-float-delayed"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14 lg:px-8 lg:py-24">
        <div className="animate-fade-up max-w-xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5 animate-bounce-soft" aria-hidden />
            SpeakUp · A1–C2
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="accent">
              <Link href="/dashboard">
                {t("startLearning")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/courses">{t("exploreCourses")}</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BookOpenCheck className="h-4 w-4 text-primary" aria-hidden />
              {t("heroBadgeLessons")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mic className="h-4 w-4 text-accent" aria-hidden />
              {t("heroBadgeSpeaking")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-secondary" aria-hidden />
              {t("heroBadgeProgress")}
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="animate-float-soft relative">
            <div className="speakup-hero-panel relative overflow-hidden rounded-[1.75rem] p-5 text-white shadow-[var(--shadow)] sm:p-7">
              <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-orange-400/30 blur-2xl" aria-hidden />
              <div className="absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-violet-200/20 blur-2xl" aria-hidden />

              <div className="relative mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-100">{t("heroAppLabel")}</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold">{t("heroAppTitle")}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <Flame className="h-6 w-6 text-orange-300 animate-bounce-soft" aria-hidden />
                </div>
              </div>

              <div className="relative mb-5 grid grid-cols-3 gap-2">
                {[
                  { value: "6", label: t("statLevelsShort") },
                  { value: "6", label: t("statSkillsShort") },
                  { value: "A1–C2", label: t("statRangeShort") },
                ].map((stat, i) => (
                  <div
                    key={stat.label}
                    className="animate-scale-in rounded-2xl bg-white/10 px-3 py-3 text-center backdrop-blur"
                    style={{ animationDelay: `${180 + i * 90}ms` }}
                  >
                    <p className="font-display text-lg font-bold">{stat.value}</p>
                    <p className="text-[10px] text-indigo-100">{stat.label}</p>
                  </div>
                ))}
              </div>

              <ul className="relative space-y-2.5">
                {pathItems.map((item, index) => (
                  <li
                    key={item.labelKey}
                    className="animate-slide-left flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 backdrop-blur"
                    style={{ animationDelay: `${320 + index * 110}ms` }}
                  >
                    <span className="text-sm font-medium">{t(item.labelKey)}</span>
                    <span className="text-xs text-indigo-100">{t(item.valueKey)}</span>
                  </li>
                ))}
              </ul>

              <div className="relative mt-5 rounded-2xl bg-white/10 p-4 backdrop-blur">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span>{t("heroProgressLabel")}</span>
                  <span>34%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-[34%] origin-left rounded-full bg-orange-300 animate-progress-grow" />
                </div>
              </div>
            </div>
          </div>

          <div className="animate-float-delayed absolute -bottom-4 -left-3 hidden rounded-2xl border border-border bg-card px-3 py-2 shadow-[var(--shadow)] sm:block">
            <p className="text-[10px] font-medium text-muted-foreground">{t("heroFloatingStreak")}</p>
            <p className="text-sm font-bold text-foreground">🔥 7 {t("days")}</p>
          </div>
          <div className="animate-float-soft absolute -right-2 top-8 hidden rounded-2xl border border-border bg-card px-3 py-2 shadow-[var(--shadow)] sm:block">
            <p className="text-[10px] font-medium text-muted-foreground">{t("heroFloatingWords")}</p>
            <p className="text-sm font-bold text-foreground">+128</p>
          </div>
        </div>
      </div>
    </section>
  );
}
