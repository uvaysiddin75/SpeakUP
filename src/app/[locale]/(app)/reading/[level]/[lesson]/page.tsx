import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getReadingLesson } from "@/services/skills-service";

export default async function ReadingLessonPage({
  params,
}: {
  params: Promise<{ locale: string; level: string; lesson: string }>;
}) {
  const { locale, level, lesson: lessonSlug } = await params;
  setRequestLocale(locale);

  let lesson: Awaited<ReturnType<typeof getReadingLesson>> = null;
  try {
    lesson = await getReadingLesson(level, lessonSlug);
  } catch {
    lesson = null;
  }
  if (!lesson) notFound();

  const wordCount = lesson.text.trim().split(/\s+/).length;
  const readMinutes = Math.max(1, Math.round(wordCount / 160));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">{lesson.levelCode}</Badge>
          <Badge>{lesson.difficulty}</Badge>
          <Badge variant="accent">
            <Clock3 className="mr-1 h-3 w-3" />
            {readMinutes} min
          </Badge>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {lesson.title}
        </h1>
        {lesson.description ? (
          <p className="text-muted-foreground">{lesson.description}</p>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Article</CardTitle>
          </CardHeader>
          <CardContent>
            <article className="whitespace-pre-wrap text-base leading-8 tracking-[0.01em]">
              {lesson.text}
            </article>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reading progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProgressBar value={0} label="In progress" />
              <p className="text-xs text-muted-foreground">
                ~{wordCount} words · difficulty {lesson.difficulty}
              </p>
            </CardContent>
          </Card>

          {lesson.vocabulary.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Vocabulary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lesson.vocabulary.map((item) => (
                  <div
                    key={item.word}
                    className="rounded-xl bg-muted/60 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-primary">{item.word}</span>
                    <span className="text-muted-foreground"> — {item.meaning}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {lesson.importantWords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {lesson.importantWords.map((word) => (
                <Badge key={word} variant="accent">
                  {word}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {lesson.quiz?.id ? (
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/quiz/${lesson.quiz.id}`}>Start reading test</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/reading">All lessons</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
