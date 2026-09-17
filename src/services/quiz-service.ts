import { Prisma } from "@prisma/client";
import { PASSING_SCORE } from "@/lib/curriculum";
import { prisma } from "@/lib/prisma";

export type PublicQuestion = {
  id: string;
  type: string;
  prompt: string;
  options: unknown;
  explanation: string | null;
  difficulty: string;
};

export type QuizSession = {
  quizId: string;
  title: string;
  description: string | null;
  type: string;
  questionCount: number;
  passScore: number;
  questions: PublicQuestion[];
  skillKind: "vocabulary" | "reading" | "listening" | "speaking" | null;
  skillItemId: string | null;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function shuffleOptions(options: unknown): unknown {
  if (!Array.isArray(options)) return options;
  if (options.every((item) => typeof item === "string")) {
    return shuffle(options as string[]);
  }
  return options;
}

export async function getQuizSession(quizId: string): Promise<QuizSession | null> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: { question: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!quiz || !quiz.isPublished) return null;

  const selected = shuffle(quiz.questions)
    .slice(0, quiz.questionCount)
    .map(({ question }) => ({
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      options: shuffleOptions(question.options),
      explanation: question.explanation,
      difficulty: question.difficulty,
    }));

  let skillKind: QuizSession["skillKind"] = null;
  let skillItemId: string | null = null;
  if (quiz.vocabularyTopicId) {
    skillKind = "vocabulary";
    skillItemId = quiz.vocabularyTopicId;
  } else if (quiz.readingTextId) {
    skillKind = "reading";
    skillItemId = quiz.readingTextId;
  } else if (quiz.listeningTaskId) {
    skillKind = "listening";
    skillItemId = quiz.listeningTaskId;
  } else if (quiz.speakingTaskId) {
    skillKind = "speaking";
    skillItemId = quiz.speakingTaskId;
  }

  return {
    quizId: quiz.id,
    title: quiz.title,
    description: quiz.description,
    type: quiz.type,
    questionCount: selected.length,
    passScore: quiz.passScore || PASSING_SCORE,
    questions: selected,
    skillKind,
    skillItemId,
  };
}

function normalizeAnswer(value: unknown): string {
  if (typeof value === "string") return value.trim().toLowerCase();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return value.map(String).join("||").toLowerCase();
  if (value && typeof value === "object") return JSON.stringify(value).toLowerCase();
  return String(value ?? "").toLowerCase();
}

export function isAnswerCorrect(correctAnswer: unknown, userAnswer: unknown): boolean {
  return normalizeAnswer(correctAnswer) === normalizeAnswer(userAnswer);
}

export type GradePayload = {
  quizId: string;
  answers: Array<{ questionId: string; userAnswer: unknown; timeSpentSec?: number }>;
  timeSpentSec: number;
  userId?: string;
};

export async function gradeQuizAttempt(payload: GradePayload) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: payload.quizId },
    include: {
      questions: { include: { question: true } },
    },
  });

  if (!quiz) throw new Error("Quiz not found");

  const byId = new Map(quiz.questions.map((item) => [item.questionId, item.question]));
  let correctAnswers = 0;
  const details: Array<{
    questionId: string;
    prompt: string;
    userAnswer: unknown;
    correctAnswer: unknown;
    explanation: string | null;
    isCorrect: boolean;
  }> = [];

  for (const answer of payload.answers) {
    const question = byId.get(answer.questionId);
    if (!question) continue;
    const ok = isAnswerCorrect(question.correctAnswer, answer.userAnswer);
    if (ok) correctAnswers += 1;
    details.push({
      questionId: question.id,
      prompt: question.prompt,
      userAnswer: answer.userAnswer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      isCorrect: ok,
    });
  }

  const total = Math.max(payload.answers.length, 1);
  const wrongAnswers = total - correctAnswers;
  const percentage = Math.round((correctAnswers / total) * 1000) / 10;
  const passed = percentage >= (quiz.passScore || PASSING_SCORE);

  // Guest attempts are graded in-memory until auth (Stage 4)
  if (!payload.userId) {
    return {
      attemptId: `guest_${Date.now()}`,
      score: correctAnswers,
      correctAnswers,
      wrongAnswers,
      percentage,
      timeSpentSec: payload.timeSpentSec,
      passed,
      passScore: quiz.passScore || PASSING_SCORE,
      title: quiz.title,
      details,
      persisted: false as const,
    };
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: payload.userId,
      quizId: quiz.id,
      score: correctAnswers,
      correctAnswers,
      wrongAnswers,
      percentage,
      timeSpentSec: payload.timeSpentSec,
      passed,
      levelId: quiz.levelId,
      categoryId: quiz.categoryId,
      topicId: quiz.topicId,
      subtopicId: quiz.subtopicId,
      answers: {
        create: details.map((item) => ({
          questionId: item.questionId,
          userAnswer: item.userAnswer as Prisma.InputJsonValue,
          isCorrect: item.isCorrect,
        })),
      },
    },
  });

  return {
    attemptId: attempt.id,
    score: correctAnswers,
    correctAnswers,
    wrongAnswers,
    percentage,
    timeSpentSec: payload.timeSpentSec,
    passed,
    passScore: quiz.passScore || PASSING_SCORE,
    title: quiz.title,
    details,
    persisted: true as const,
  };
}
