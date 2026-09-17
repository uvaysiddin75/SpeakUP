import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClipboardCheck } from "lucide-react";
import { CourseBreadcrumbs } from "@/components/courses/course-breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getQuizHref } from "@/lib/curriculum";
import {
  buildCourseBreadcrumbs,
  getCategoryFromLevel,
} from "@/services/curriculum-service";

export default async function CourseCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; level: string; category: string }>;
}) {
  const { locale, level: levelSlug, category: categorySlug } = await params;
  setRequestLocale(locale);

  const result = await getCategoryFromLevel(levelSlug, categorySlug);
  if (!result) notFound();

  const { level, category } = result;
  const tHome = await getTranslations("home");
  const tCourses = await getTranslations("courses");

  const breadcrumbs = buildCourseBreadcrumbs({
    levelCode: level.code,
    levelSlug: level.slug,
    levelName: tHome(`levels.${level.code}.name`),
    categoryName: category.name,
    categorySlug: category.slug,
  });

  return (
    <div className="space-y-8">
      <CourseBreadcrumbs items={breadcrumbs} />

      <div className="space-y-3">
        <Badge variant="primary">{level.code}</Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {category.name}
        </h1>
        <p className="max-w-2xl text-muted-foreground">{category.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {category.topics.map((topic) => {
          const topicHref = `/courses/${level.slug}/${category.slug}/${topic.slug}`;
          const availableCount = topic.subtopics.filter(
            (sub) => sub.status !== "LOCKED",
          ).length;

          return (
            <Link key={topic.slug} href={topicHref} className="group block h-full">
              <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="group-hover:text-primary">
                      {topic.title}
                    </CardTitle>
                    <Badge variant="default" className="capitalize">
                      {topic.difficulty.toLowerCase()}
                    </Badge>
                  </div>
                  <CardDescription>{topic.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {tCourses("subtopicsInTopic", { count: topic.subtopics.length })}
                    {" · "}
                    {tCourses("availableCount", { count: availableCount })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">{tCourses("categoryFinalTest")}</p>
              <p className="text-sm text-muted-foreground">
                {tCourses("categoryFinalTestNote")}
              </p>
            </div>
          </div>
          <Link
            href={getQuizHref(
              null,
              `/courses/${level.slug}/${category.slug}/test`,
            )}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow)] transition-colors hover:bg-primary-hover"
          >
            {tCourses("startTest")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
