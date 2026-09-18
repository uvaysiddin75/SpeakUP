import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  completeLesson,
  completePracticeAttempt,
  endLearningSession,
  markWordLearnedDb,
  startLearningSession,
} from "@/services/progress-service";

export const runtime = "nodejs";

const lessonSchema = z.object({
  action: z.literal("complete_lesson"),
  subtopicId: z.string().min(1),
});

const practiceSchema = z.object({
  action: z.literal("complete_practice"),
  practiceId: z.string().min(1),
  answers: z.array(
    z.object({
      itemId: z.string().min(1),
      userAnswer: z.unknown(),
    }),
  ),
});

const wordSchema = z.object({
  action: z.literal("mark_word"),
  wordId: z.string().min(1),
});

const sessionStartSchema = z.object({
  action: z.literal("session_start"),
  kind: z.string().min(1),
  entityId: z.string().optional(),
});

const sessionEndSchema = z.object({
  action: z.literal("session_end"),
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = (body as { action?: string })?.action;

  try {
    if (action === "complete_lesson") {
      const parsed = lessonSchema.parse(body);
      const progress = await completeLesson(userId, parsed.subtopicId);
      return NextResponse.json({ ok: true, progress });
    }
    if (action === "complete_practice") {
      const parsed = practiceSchema.parse(body);
      const result = await completePracticeAttempt({
        userId,
        practiceId: parsed.practiceId,
        answers: parsed.answers,
      });
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === "mark_word") {
      const parsed = wordSchema.parse(body);
      await markWordLearnedDb(userId, parsed.wordId);
      return NextResponse.json({ ok: true });
    }
    if (action === "session_start") {
      const parsed = sessionStartSchema.parse(body);
      const learningSession = await startLearningSession(
        userId,
        parsed.kind,
        parsed.entityId,
      );
      return NextResponse.json({ ok: true, sessionId: learningSession.id });
    }
    if (action === "session_end") {
      const parsed = sessionEndSchema.parse(body);
      const ended = await endLearningSession(userId, parsed.sessionId);
      return NextResponse.json({ ok: true, session: ended });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status =
      message.includes("locked") || message.includes("Unauthorized")
        ? 403
        : message.includes("not found")
          ? 404
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
