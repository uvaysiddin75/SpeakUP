import { useTranslations } from "next-intl";
import { CEFR_LEVELS } from "@/lib/constants";
import { LevelCard } from "@/components/ui/level-card";

export function LevelsSection() {
  const t = useTranslations("home");

  return (
    <section className="border-y border-border bg-card/50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("levelsTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("levelsSubtitle")}</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CEFR_LEVELS.map((level) => (
            <LevelCard
              key={level.code}
              code={level.code}
              name={t(`levels.${level.code}.name`)}
              description={t(`levels.${level.code}.description`)}
              topicsLabel={t("topics", { count: level.topicsCount })}
              href={`/courses/${level.slug}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
