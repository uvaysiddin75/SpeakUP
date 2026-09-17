import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAnswerCorrect } from "@/services/quiz-service";

const bodySchema = z.object({
  questionId: z.string().min(1),
  userAnswer: z.unknown(),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const question = await prisma.question.findUnique({
    where: { id: parsed.data.questionId },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const correct = isAnswerCorrect(question.correctAnswer, parsed.data.userAnswer);

  return NextResponse.json({
    isCorrect: correct,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  });
}
