import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CourseBreadcrumbs } from "@/components/courses/course-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@/i18n/navigation";
import {
  buildCourseBreadcrumbs,
  getPracticeDetail,
} from "@/services/curriculum-service";

export default async function PracticePage({
  params,
}: {
  params: Promise<{
    locale: string;
    level: string;
    category: string;
    topic: string;
    subtopic: string;
  }>;
}) {
  const {
    locale,
    level: levelSlug,
    category: categorySlug,
    topic: topicSlug,
    subtopic: subtopicSlug,
  } = await params;
  setRequestLocale(locale);

  const practice = await getPracticeDetail(
    levelSlug,
    categorySlug,
    topicSlug,
    subtopicSlug,
  );
  if (!practice) notFound();

  if (practice.subtopic.status === "LOCKED") {
    redirect(
      `/${locale}/courses/${levelSlug}/${categorySlug}/${topicSlug}/${subtopicSlug}`,
    );
  }

  const tHome = await getTranslations("home");
  const tCourses = await getTranslations("courses");

  const breadcrumbs = buildCourseBreadcrumbs({
    levelCode: practice.subtopic.levelCode,
    levelSlug: practice.subtopic.levelSlug,
    levelName: tHome(`levels.${practice.subtopic.levelCode}.name`),
    categoryName: practice.subtopic.categoryName,
    categorySlug: practice.subtopic.categorySlug,
    topicTitle: practice.subtopic.topicTitle,
    topicSlug: practice.subtopic.topicSlug,
    subtopicTitle: practice.subtopic.title,
  });

  const lessonHref = `/courses/${levelSlug}/${categorySlug}/${topicSlug}/${subtopicSlug}`;
  const testHref = practice.subtopic.quizId
    ? `/quiz/${practice.subtopic.quizId}`
    : `${lessonHref}/test`;

  return (
    <div className="space-y-8">
      <CourseBreadcrumbs items={breadcrumbs} />

      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {practice.title}
        </h1>
        {practice.instructions ? (
          <p className="text-muted-foreground">{practice.instructions}</p>
        ) : null}
      </div>

      {practice.items.length === 0 ? (
        <EmptyState
          title={tCourses("practice")}
          description={tCourses("practiceEmpty")}
        />
      ) : (
        <div className="space-y-4">
          {practice.items.map((item, index) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {index + 1}. {item.prompt}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.isArray(item.options) ? (
                  <ul className="space-y-2">
                    {item.options.map((option) => (
                      <li
                        key={String(option)}
                        className="rounded-xl border border-border px-3 py-2 text-sm"
                      >
                        {String(option)}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {item.explanation ? (
                  <p className="text-sm text-muted-foreground">
                    {item.explanation}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" asChild>
          <Link href={lessonHref}>{tCourses("backToLesson")}</Link>
        </Button>
        <Button asChild>
          <Link href={testHref}>{tCourses("startTest")}</Link>
        </Button>
      </div>
    </div>
  );
}
