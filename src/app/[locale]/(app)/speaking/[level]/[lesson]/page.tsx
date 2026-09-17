import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SpeakingPracticeClient } from "@/components/speaking/speaking-practice-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSpeakingLesson } from "@/services/skills-service";

export default async function SpeakingLessonPage({
  params,
}: {
  params: Promise<{ locale: string; level: string; lesson: string }>;
}) {
  const { locale, level, lesson: lessonSlug } = await params;
  setRequestLocale(locale);

  let lesson: Awaited<ReturnType<typeof getSpeakingLesson>> = null;
  try {
    lesson = await getSpeakingLesson(level, lessonSlug);
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
          <Badge variant="accent">{lesson.exerciseType.replaceAll("_", " ")}</Badge>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {lesson.title}
        </h1>
      </div>

      <SpeakingPracticeClient
        taskId={lesson.id}
        prompt={lesson.prompt}
        instructions={lesson.instructions}
        usefulVocabulary={lesson.usefulVocabulary}
        usefulPhrases={lesson.usefulPhrases}
        exampleAnswer={lesson.exampleAnswer}
        timerSec={lesson.timerSec}
        tips={lesson.tips}
      />

      <Button asChild variant="outline">
        <Link href="/speaking">All speaking topics</Link>
      </Button>
    </div>
  );
}
