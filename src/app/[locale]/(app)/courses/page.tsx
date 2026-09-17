import { getTranslations, setRequestLocale } from "next-intl/server";
import { CEFR_LEVELS } from "@/lib/constants";
import { LevelCard } from "@/components/ui/level-card";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.courses");
  const tHome = await getTranslations("home");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CEFR_LEVELS.map((level) => (
          <LevelCard
            key={level.code}
            code={level.code}
            name={tHome(`levels.${level.code}.name`)}
            description={tHome(`levels.${level.code}.description`)}
            topicsLabel={tHome("topics", { count: level.topicsCount })}
            href={`/courses/${level.slug}`}
          />
        ))}
      </div>
    </div>
  );
}
