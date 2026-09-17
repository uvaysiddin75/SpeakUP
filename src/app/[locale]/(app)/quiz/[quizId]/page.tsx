import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SkillAwareQuizPlayer } from "@/components/quiz/skill-aware-quiz-player";
import { getQuizSession } from "@/services/quiz-service";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ locale: string; quizId: string }>;
}) {
  const { locale, quizId } = await params;
  setRequestLocale(locale);

  let session = null;
  try {
    session = await getQuizSession(quizId);
  } catch {
    session = null;
  }

  if (!session || session.questions.length === 0) {
    notFound();
  }

  return (
    <SkillAwareQuizPlayer
      quizId={session.quizId}
      title={session.title}
      passScore={session.passScore}
      questions={session.questions}
      skillKind={session.skillKind ?? undefined}
      skillItemId={session.skillItemId}
    />
  );
}
