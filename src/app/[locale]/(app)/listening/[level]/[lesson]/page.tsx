import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AudioPlayer } from "@/components/listening/audio-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getListeningLesson } from "@/services/skills-service";

export default async function ListeningLessonPage({
  params,
}: {
  params: Promise<{ locale: string; level: string; lesson: string }>;
}) {
  const { locale, level, lesson: lessonSlug } = await params;
  setRequestLocale(locale);

  let lesson: Awaited<ReturnType<typeof getListeningLesson>> = null;
  try {
    lesson = await getListeningLesson(level, lessonSlug);
  } catch {
    lesson = null;
  }
  if (!lesson) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">{lesson.levelCode}</Badge>
          <Badge>{lesson.difficulty}</Badge>
          {lesson.durationSec ? <Badge>~{lesson.durationSec}s</Badge> : null}
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {lesson.title}
        </h1>
        {lesson.description ? (
          <p className="text-muted-foreground">{lesson.description}</p>
        ) : null}
      </div>

      <AudioPlayer
        audioUrl={lesson.audioUrl}
        transcript={lesson.transcript}
        title="Listening player"
      />

      {lesson.vocabulary.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Key vocabulary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {lesson.vocabulary.map((item) => (
              <div key={item.word} className="rounded-xl bg-muted/60 px-3 py-2 text-sm">
                <span className="font-semibold">{item.word}</span>
                <span className="text-muted-foreground"> — {item.meaning}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {lesson.quiz?.id ? (
          <Button asChild>
            <Link href={`/quiz/${lesson.quiz.id}`}>Start listening test</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/listening">All lessons</Link>
        </Button>
      </div>
    </div>
  );
}
