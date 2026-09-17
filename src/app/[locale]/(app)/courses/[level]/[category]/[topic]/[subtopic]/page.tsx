import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen, ClipboardCheck, Lock, PenLine } from "lucide-react";
import { CourseBreadcrumbs } from "@/components/courses/course-breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getQuizHref } from "@/lib/curriculum";
import {
  buildCourseBreadcrumbs,
  getSubtopicDetail,
} from "@/services/curriculum-service";

export default async function CourseSubtopicPage({
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

  const subtopic = await getSubtopicDetail(
    levelSlug,
    categorySlug,
    topicSlug,
    subtopicSlug,
  );
  if (!subtopic) notFound();

  const tHome = await getTranslations("home");
  const tCourses = await getTranslations("courses");

  const breadcrumbs = buildCourseBreadcrumbs({
    levelCode: subtopic.levelCode,
    levelSlug: subtopic.levelSlug,
    levelName: tHome(`levels.${subtopic.levelCode}.name`),
    categoryName: subtopic.categoryName,
    categorySlug: subtopic.categorySlug,
    topicTitle: subtopic.topicTitle,
    topicSlug: subtopic.topicSlug,
    subtopicTitle: subtopic.title,
  });

  const testFallback = `/courses/${subtopic.levelSlug}/${subtopic.categorySlug}/${subtopic.topicSlug}/${subtopic.slug}/test`;
  const practiceHref = `/courses/${subtopic.levelSlug}/${subtopic.categorySlug}/${subtopic.topicSlug}/${subtopic.slug}/practice`;

  if (subtopic.status === "LOCKED") {
    return (
      <div className="space-y-8">
        <CourseBreadcrumbs items={breadcrumbs} />
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <Lock className="h-10 w-10 text-muted-foreground/60" aria-hidden />
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold">{subtopic.title}</h1>
              <p className="max-w-md text-muted-foreground">
                {tCourses("lockedNote")}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link
                href={`/courses/${subtopic.levelSlug}/${subtopic.categorySlug}/${subtopic.topicSlug}`}
              >
                {tCourses("backToTopic")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CourseBreadcrumbs items={breadcrumbs} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">{subtopic.levelCode}</Badge>
          <Badge variant="default">{subtopic.categoryName}</Badge>
          <Badge variant="accent">
            {tCourses("estimatedMin", { count: subtopic.lesson.estimatedMin })}
          </Badge>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {subtopic.title}
        </h1>
        <p className="max-w-2xl text-muted-foreground">{subtopic.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden />
            {tCourses("explanation")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground dark:prose-invert">
            {subtopic.lesson.explanation}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tCourses("examples")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subtopic.lesson.examples.map((example, index) => (
            <div
              key={`${example.en}-${index}`}
              className="rounded-xl border border-border bg-muted/30 p-4"
            >
              <p className="font-medium">{example.en}</p>
              {example.note ? (
                <p className="mt-1 text-sm text-muted-foreground">{example.note}</p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      {subtopic.lesson.vocabulary && subtopic.lesson.vocabulary.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{tCourses("vocabulary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {subtopic.lesson.vocabulary.map((item) => (
                <li
                  key={item.word}
                  className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{item.word}</p>
                    {item.example ? (
                      <p className="text-sm text-muted-foreground">{item.example}</p>
                    ) : null}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {[item.translationRu, item.translationUz]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {subtopic.lesson.tips ? (
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-5">
            <p className="text-sm">
              <span className="font-semibold">{tCourses("tips")}: </span>
              {subtopic.lesson.tips}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" className="flex-1" asChild>
          <Link href={practiceHref}>
            <PenLine className="h-4 w-4" aria-hidden />
            {tCourses("practice")}
          </Link>
        </Button>
        <Button className="flex-1" asChild>
          <Link href={getQuizHref(subtopic.quizId, testFallback)}>
            <ClipboardCheck className="h-4 w-4" aria-hidden />
            {tCourses("startTest")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
