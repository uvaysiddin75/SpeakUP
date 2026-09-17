import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { gradeQuizAttempt } from "@/services/quiz-service";

const bodySchema = z.object({
  quizId: z.string().min(1),
  timeSpentSec: z.number().int().nonnegative(),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      userAnswer: z.unknown(),
      timeSpentSec: z.number().int().nonnegative().optional(),
    }),
  ),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid quiz payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await gradeQuizAttempt({
      ...parsed.data,
      userId: session?.user?.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Quiz not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
