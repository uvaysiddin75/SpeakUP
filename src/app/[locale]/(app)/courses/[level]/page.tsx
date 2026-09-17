import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CourseTree } from "@/components/courses/course-tree";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getLevelTree } from "@/services/curriculum-service";

export default async function CourseLevelPage({
  params,
}: {
  params: Promise<{ locale: string; level: string }>;
}) {
  const { locale, level: levelSlug } = await params;
  setRequestLocale(locale);

  const level = await getLevelTree(levelSlug);
  if (!level) notFound();

  const tHome = await getTranslations("home");
  const tCourses = await getTranslations("courses");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="primary">{level.code}</Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {level.code} · {tHome(`levels.${level.code}.name`)}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {tHome(`levels.${level.code}.description`)}
        </p>
        <div className="max-w-md">
          <ProgressBar
            value={level.progressPercent}
            label={tCourses("progress")}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {tCourses("subtopicsCount", { count: level.totalSubtopics })}
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          {tCourses("curriculum")}
        </h2>
        <CourseTree level={level} />
      </div>
    </div>
  );
}
