/**
 * Unified real progress calculation & persistence.
 * All percentages are derived server-side from DB state — never trust client %.
 */

import {
  CategoryType,
  ProgressStatus,
  Prisma,
  QuizType,
  TopicStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MASTERED_SCORE = 90;
const DEFAULT_PASS = 70;

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysBetweenUtc(a: Date, b: Date) {
  const ms = startOfUtcDay(b).getTime() - startOfUtcDay(a).getTime();
  return Math.round(ms / 86_400_000);
}

export async function recordMeaningfulActivity(
  userId: string,
  activity: {
    type: string;
    title: string;
    description?: string;
    meta?: Prisma.InputJsonValue;
  },
  tx: Prisma.TransactionClient = prisma,
) {
  const today = startOfUtcDay();
  await tx.activityDay.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today },
    update: {},
  });

  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user) return;

  let streak = user.streak;
  if (!user.lastActiveAt) {
    streak = 1;
  } else {
    const gap = daysBetweenUtc(user.lastActiveAt, new Date());
    if (gap === 0) {
      // same day — keep streak
    } else if (gap === 1) {
      streak = user.streak + 1;
    } else {
      streak = 1;
    }
  }

  const longestStreak = Math.max(user.longestStreak, streak);

  await tx.user.update({
    where: { id: userId },
    data: {
      streak,
      longestStreak,
      lastActiveAt: new Date(),
    },
  });

  await tx.userActivity.create({
    data: {
      userId,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      meta: activity.meta,
    },
  });
}

export async function startLearningSession(
  userId: string,
  kind: string,
  entityId?: string,
) {
  return prisma.learningSession.create({
    data: { userId, kind, entityId: entityId ?? null },
  });
}

export async function endLearningSession(userId: string, sessionId: string) {
  const session = await prisma.learningSession.findFirst({
    where: { id: sessionId, userId, endedAt: null },
  });
  if (!session) return null;

  const endedAt = new Date();
  const durationSec = Math.max(
    0,
    Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000),
  );
  // Cap single session at 3 hours to avoid idle tabs
  const capped = Math.min(durationSec, 3 * 3600);

  const [updated] = await prisma.$transaction([
    prisma.learningSession.update({
      where: { id: session.id },
      data: { endedAt, durationSec: capped },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { totalLearningSec: { increment: capped } },
    }),
  ]);

  return updated;
}

function subtopicPercent(parts: {
  hasLesson: boolean;
  hasPractice: boolean;
  hasTest: boolean;
  lessonDone: boolean;
  practiceDone: boolean;
  testPassed: boolean;
}) {
  const weights: Array<{ done: boolean; weight: number }> = [];
  if (parts.hasLesson) weights.push({ done: parts.lessonDone, weight: 1 });
  if (parts.hasPractice) weights.push({ done: parts.practiceDone, weight: 1 });
  if (parts.hasTest) weights.push({ done: parts.testPassed, weight: 1 });
  if (weights.length === 0) return 0;
  const done = weights.filter((w) => w.done).length;
  return Math.round((done / weights.length) * 1000) / 10;
}

function resolveSubtopicStatus(args: {
  previousUnlocked: boolean;
  percent: number;
  lessonDone: boolean;
  practiceDone: boolean;
  testPassed: boolean;
  bestScore: number | null;
}): ProgressStatus {
  if (!args.previousUnlocked) return ProgressStatus.LOCKED;
  if (
    args.testPassed &&
    args.lessonDone &&
    args.practiceDone &&
    (args.bestScore ?? 0) >= MASTERED_SCORE
  ) {
    return ProgressStatus.MASTERED;
  }
  if (args.percent >= 100 && args.testPassed) return ProgressStatus.COMPLETED;
  // If no test required and all done
  if (args.percent >= 100) return ProgressStatus.COMPLETED;
  if (args.lessonDone || args.practiceDone || args.testPassed || args.percent > 0) {
    return ProgressStatus.IN_PROGRESS;
  }
  return ProgressStatus.AVAILABLE;
}

/** Ensure first subtopic of a topic is unlocked; apply sequential lock rules. */
export async function ensureTopicUnlockState(userId: string, topicId: string) {
  const subtopics = await prisma.subtopic.findMany({
    where: { topicId, isPublished: true },
    orderBy: { order: "asc" },
    include: {
      lesson: { select: { id: true } },
      practice: { select: { id: true } },
      quizzes: {
        where: { type: QuizType.SUBTOPIC, isPublished: true },
        take: 1,
        select: { id: true },
      },
      progress: { where: { userId }, take: 1 },
    },
  });

  let previousCompleted = true;

  for (const sub of subtopics) {
    const existing = sub.progress[0];
    const hasLesson = !!sub.lesson;
    const hasPractice = !!sub.practice;
    const hasTest = sub.quizzes.length > 0;
    const lessonDone = existing?.lessonDone ?? false;
    const practiceDone = existing?.practiceDone ?? false;
    const testPassed = existing?.testPassed ?? false;
    // If practice doesn't exist, treat as done for completion math
    const practiceOk = hasPractice ? practiceDone : true;
    const lessonOk = hasLesson ? lessonDone : true;
    const testOk = hasTest ? testPassed : true;

    const percent = subtopicPercent({
      hasLesson,
      hasPractice,
      hasTest,
      lessonDone: lessonOk,
      practiceDone: practiceOk,
      testPassed: testOk,
    });

    const unlocked = previousCompleted;
    const status = resolveSubtopicStatus({
      previousUnlocked: unlocked,
      percent,
      lessonDone: lessonOk,
      practiceDone: practiceOk,
      testPassed: testOk,
      bestScore: existing?.bestScore ?? null,
    });

    await prisma.subtopicProgress.upsert({
      where: { userId_subtopicId: { userId, subtopicId: sub.id } },
      create: {
        userId,
        subtopicId: sub.id,
        status,
        progressPercent: unlocked ? percent : 0,
        lessonDone,
        practiceDone,
        testPassed,
        bestScore: existing?.bestScore ?? null,
        latestScore: existing?.latestScore ?? null,
        attemptsCount: existing?.attemptsCount ?? 0,
        startedAt:
          status === ProgressStatus.IN_PROGRESS ||
          status === ProgressStatus.COMPLETED ||
          status === ProgressStatus.MASTERED
            ? existing?.startedAt ?? new Date()
            : null,
        completedAt:
          status === ProgressStatus.COMPLETED || status === ProgressStatus.MASTERED
            ? existing?.completedAt ?? new Date()
            : null,
        lastActivityAt: existing?.lastActivityAt ?? null,
      },
      update: {
        status,
        progressPercent: unlocked ? percent : existing?.progressPercent ?? 0,
      },
    });

    const done =
      status === ProgressStatus.COMPLETED || status === ProgressStatus.MASTERED;
    previousCompleted = done;
  }

  await recalculateTopicProgress(userId, topicId);
}

export async function recalculateTopicProgress(userId: string, topicId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      subtopics: {
        where: { isPublished: true },
        include: { progress: { where: { userId }, take: 1 } },
      },
      quizzes: {
        where: { type: QuizType.TOPIC_FINAL, isPublished: true },
        take: 1,
      },
      category: { select: { id: true, levelId: true } },
    },
  });
  if (!topic) return;

  const total = topic.subtopics.length;
  const done = topic.subtopics.filter((s) => {
    const st = s.progress[0]?.status;
    return st === ProgressStatus.COMPLETED || st === ProgressStatus.MASTERED;
  }).length;
  const percent = total > 0 ? Math.round((done / total) * 1000) / 10 : 0;

  let finalPassed = false;
  let bestFinalScore: number | null = null;
  if (topic.quizzes[0]) {
    const best = await prisma.quizAttempt.findFirst({
      where: { userId, quizId: topic.quizzes[0].id, passed: true },
      orderBy: { percentage: "desc" },
    });
    if (best) {
      finalPassed = true;
      bestFinalScore = best.percentage;
    }
  }

  const status: TopicStatus =
    done === 0
      ? TopicStatus.NOT_STARTED
      : done >= total
        ? TopicStatus.COMPLETED
        : TopicStatus.IN_PROGRESS;

  await prisma.topicProgress.upsert({
    where: { userId_topicId: { userId, topicId } },
    create: {
      userId,
      topicId,
      status,
      percent,
      subtopicsDone: done,
      subtopicsTotal: total,
      finalPassed,
      bestFinalScore,
      startedAt: done > 0 ? new Date() : null,
      completedAt: status === TopicStatus.COMPLETED ? new Date() : null,
    },
    update: {
      status,
      percent,
      subtopicsDone: done,
      subtopicsTotal: total,
      finalPassed,
      bestFinalScore,
      completedAt: status === TopicStatus.COMPLETED ? new Date() : null,
      startedAt: done > 0 ? undefined : null,
    },
  });

  await recalculateCategoryProgress(userId, topic.category.id);
}

export async function recalculateCategoryProgress(
  userId: string,
  categoryId: string,
) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      topics: {
        where: { isPublished: true },
        include: { progress: { where: { userId }, take: 1 } },
      },
      quizzes: {
        where: { type: QuizType.CATEGORY_FINAL, isPublished: true },
        take: 1,
      },
    },
  });
  if (!category) return;

  const total = category.topics.length;
  const done = category.topics.filter(
    (t) => t.progress[0]?.status === TopicStatus.COMPLETED,
  ).length;
  const percent = total > 0 ? Math.round((done / total) * 1000) / 10 : 0;

  let finalPassed = false;
  let bestFinalScore: number | null = null;
  if (category.quizzes[0]) {
    const best = await prisma.quizAttempt.findFirst({
      where: { userId, quizId: category.quizzes[0].id, passed: true },
      orderBy: { percentage: "desc" },
    });
    if (best) {
      finalPassed = true;
      bestFinalScore = best.percentage;
    }
  }

  const status: ProgressStatus =
    done === 0
      ? ProgressStatus.AVAILABLE
      : done >= total
        ? ProgressStatus.COMPLETED
        : ProgressStatus.IN_PROGRESS;

  await prisma.categoryProgress.upsert({
    where: { userId_categoryId: { userId, categoryId } },
    create: {
      userId,
      categoryId,
      status,
      percent,
      topicsDone: done,
      topicsTotal: total,
      finalPassed,
      bestFinalScore,
      startedAt: done > 0 ? new Date() : null,
      completedAt: status === ProgressStatus.COMPLETED ? new Date() : null,
    },
    update: {
      status,
      percent,
      topicsDone: done,
      topicsTotal: total,
      finalPassed,
      bestFinalScore,
      completedAt: status === ProgressStatus.COMPLETED ? new Date() : null,
    },
  });

  await recalculateLevelProgress(userId, category.levelId);
}

export async function recalculateLevelProgress(userId: string, levelId: string) {
  const level = await prisma.level.findUnique({
    where: { id: levelId },
    include: {
      categories: {
        where: { isPublished: true },
        include: { progress: { where: { userId }, take: 1 } },
      },
      quizzes: {
        where: { type: QuizType.LEVEL_FINAL, isPublished: true },
        take: 1,
      },
    },
  });
  if (!level) return;

  const total = level.categories.length;
  const percents = level.categories.map((c) => c.progress[0]?.percent ?? 0);
  const percent =
    percents.length > 0
      ? Math.round(
          (percents.reduce((a, b) => a + b, 0) / percents.length) * 10,
        ) / 10
      : 0;
  const done = level.categories.filter(
    (c) => c.progress[0]?.status === ProgressStatus.COMPLETED,
  ).length;

  let finalPassed = false;
  let bestFinalScore: number | null = null;
  if (level.quizzes[0]) {
    const best = await prisma.quizAttempt.findFirst({
      where: { userId, quizId: level.quizzes[0].id, passed: true },
      orderBy: { percentage: "desc" },
    });
    if (best) {
      finalPassed = true;
      bestFinalScore = best.percentage;
    }
  }

  const status: ProgressStatus =
    percent <= 0
      ? ProgressStatus.AVAILABLE
      : done >= total && total > 0
        ? ProgressStatus.COMPLETED
        : ProgressStatus.IN_PROGRESS;

  await prisma.levelProgress.upsert({
    where: { userId_levelId: { userId, levelId } },
    create: {
      userId,
      levelId,
      status,
      percent,
      categoriesDone: done,
      categoriesTotal: total,
      finalPassed,
      bestFinalScore,
      startedAt: percent > 0 ? new Date() : null,
      completedAt: status === ProgressStatus.COMPLETED ? new Date() : null,
    },
    update: {
      status,
      percent,
      categoriesDone: done,
      categoriesTotal: total,
      finalPassed,
      bestFinalScore,
      completedAt: status === ProgressStatus.COMPLETED ? new Date() : null,
    },
  });

  // Update currentLevel to highest in-progress/completed level by order
  const allLevels = await prisma.level.findMany({
    orderBy: { order: "asc" },
    include: { progress: { where: { userId }, take: 1 } },
  });
  let current = allLevels[0]?.code ?? "A1";
  for (const lvl of allLevels) {
    const p = lvl.progress[0]?.percent ?? 0;
    if (p > 0) current = lvl.code;
  }
  await prisma.user.update({
    where: { id: userId },
    data: { currentLevel: current },
  });
}

export async function completeLesson(userId: string, subtopicId: string) {
  const subtopic = await prisma.subtopic.findUnique({
    where: { id: subtopicId },
    include: {
      lesson: true,
      practice: { select: { id: true } },
      quizzes: {
        where: { type: QuizType.SUBTOPIC, isPublished: true },
        take: 1,
      },
      topic: { select: { id: true, title: true } },
      progress: { where: { userId }, take: 1 },
    },
  });
  if (!subtopic?.lesson) throw new Error("Lesson not found");

  // Unlock check
  await ensureTopicUnlockState(userId, subtopic.topicId);
  const current = await prisma.subtopicProgress.findUnique({
    where: { userId_subtopicId: { userId, subtopicId } },
  });
  if (current?.status === ProgressStatus.LOCKED) {
    throw new Error("Subtopic is locked");
  }

  const hasPractice = !!subtopic.practice;
  const hasTest = subtopic.quizzes.length > 0;
  const practiceDone = current?.practiceDone ?? false;
  const testPassed = current?.testPassed ?? false;
  const practiceOk = hasPractice ? practiceDone : true;
  const testOk = hasTest ? testPassed : true;
  const percent = subtopicPercent({
    hasLesson: true,
    hasPractice,
    hasTest,
    lessonDone: true,
    practiceDone: practiceOk,
    testPassed: testOk,
  });

  const status = resolveSubtopicStatus({
    previousUnlocked: true,
    percent,
    lessonDone: true,
    practiceDone: practiceOk,
    testPassed: testOk,
    bestScore: current?.bestScore ?? null,
  });

  await prisma.$transaction(async (tx) => {
    await tx.subtopicProgress.upsert({
      where: { userId_subtopicId: { userId, subtopicId } },
      create: {
        userId,
        subtopicId,
        status,
        progressPercent: percent,
        lessonDone: true,
        practiceDone,
        testPassed,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        completedAt:
          status === ProgressStatus.COMPLETED || status === ProgressStatus.MASTERED
            ? new Date()
            : null,
      },
      update: {
        lessonDone: true,
        progressPercent: percent,
        status,
        lastActivityAt: new Date(),
        startedAt: current?.startedAt ?? new Date(),
        completedAt:
          status === ProgressStatus.COMPLETED || status === ProgressStatus.MASTERED
            ? current?.completedAt ?? new Date()
            : null,
      },
    });

    await recordMeaningfulActivity(
      userId,
      {
        type: "lesson_completed",
        title: `Completed lesson — ${subtopic.title}`,
        description: subtopic.topic.title,
        meta: { subtopicId },
      },
      tx,
    );
  });

  await ensureTopicUnlockState(userId, subtopic.topicId);
  return getSubtopicProgressSnapshot(userId, subtopicId);
}

export async function completePracticeAttempt(args: {
  userId: string;
  practiceId: string;
  answers: Array<{ itemId: string; userAnswer: unknown }>;
}) {
  const practice = await prisma.practice.findUnique({
    where: { id: args.practiceId },
    include: {
      items: { orderBy: { order: "asc" } },
      subtopic: {
        include: {
          lesson: { select: { id: true } },
          quizzes: {
            where: { type: QuizType.SUBTOPIC, isPublished: true },
            take: 1,
          },
          topic: { select: { id: true, title: true } },
          progress: { where: { userId: args.userId }, take: 1 },
        },
      },
    },
  });
  if (!practice) throw new Error("Practice not found");

  await ensureTopicUnlockState(args.userId, practice.subtopic.topicId);
  const current = practice.subtopic.progress[0];
  if (current?.status === ProgressStatus.LOCKED) {
    throw new Error("Subtopic is locked");
  }

  const byId = new Map(practice.items.map((i) => [i.id, i]));
  let correct = 0;
  for (const answer of args.answers) {
    const item = byId.get(answer.itemId);
    if (!item) continue;
    const a = JSON.stringify(item.correctAnswer).toLowerCase();
    const b = JSON.stringify(answer.userAnswer).toLowerCase();
    // soft compare via string normalization
    const norm = (v: unknown) =>
      typeof v === "string"
        ? v.trim().toLowerCase()
        : JSON.stringify(v).toLowerCase();
    if (norm(item.correctAnswer) === norm(answer.userAnswer) || a === b) {
      correct += 1;
    }
  }

  const total = Math.max(practice.items.length, 1);
  const percentage = Math.round((correct / total) * 1000) / 10;
  const passed = percentage >= DEFAULT_PASS;

  await prisma.practiceAttempt.create({
    data: {
      userId: args.userId,
      practiceId: practice.id,
      score: correct,
      totalItems: total,
      correctAnswers: correct,
      percentage,
      passed,
    },
  });

  if (passed) {
    const hasLesson = !!practice.subtopic.lesson;
    const hasTest = practice.subtopic.quizzes.length > 0;
    const lessonDone = current?.lessonDone ?? false;
    const testPassed = current?.testPassed ?? false;
    const lessonOk = hasLesson ? lessonDone : true;
    const testOk = hasTest ? testPassed : true;
    const percent = subtopicPercent({
      hasLesson,
      hasPractice: true,
      hasTest,
      lessonDone: lessonOk,
      practiceDone: true,
      testPassed: testOk,
    });
    const status = resolveSubtopicStatus({
      previousUnlocked: true,
      percent,
      lessonDone: lessonOk,
      practiceDone: true,
      testPassed: testOk,
      bestScore: current?.bestScore ?? null,
    });

    await prisma.$transaction(async (tx) => {
      await tx.subtopicProgress.upsert({
        where: {
          userId_subtopicId: {
            userId: args.userId,
            subtopicId: practice.subtopicId,
          },
        },
        create: {
          userId: args.userId,
          subtopicId: practice.subtopicId,
          status,
          progressPercent: percent,
          lessonDone,
          practiceDone: true,
          testPassed,
          startedAt: new Date(),
          lastActivityAt: new Date(),
          completedAt:
            status === ProgressStatus.COMPLETED ||
            status === ProgressStatus.MASTERED
              ? new Date()
              : null,
        },
        update: {
          practiceDone: true,
          progressPercent: percent,
          status,
          lastActivityAt: new Date(),
          completedAt:
            status === ProgressStatus.COMPLETED ||
            status === ProgressStatus.MASTERED
              ? current?.completedAt ?? new Date()
              : null,
        },
      });

      await recordMeaningfulActivity(
        args.userId,
        {
          type: "practice_completed",
          title: `Completed practice — ${practice.title}`,
          description: `${percentage}%`,
          meta: { practiceId: practice.id, percentage },
        },
        tx,
      );
    });

    await ensureTopicUnlockState(args.userId, practice.subtopic.topicId);
  }

  return { percentage, correctAnswers: correct, total, passed };
}

/** Called after a QuizAttempt is persisted. */
export async function applyQuizAttemptToProgress(args: {
  userId: string;
  quizId: string;
  percentage: number;
  passed: boolean;
  title: string;
  timeSpentSec: number;
  subtopicId?: string | null;
  topicId?: string | null;
  categoryId?: string | null;
  levelId?: string | null;
  vocabularyTopicId?: string | null;
  readingTextId?: string | null;
  listeningTaskId?: string | null;
  speakingTaskId?: string | null;
}) {
  await prisma.$transaction(async (tx) => {
    await recordMeaningfulActivity(
      args.userId,
      {
        type: args.passed ? "test_passed" : "test_failed",
        title: args.passed
          ? `Passed test — ${args.title}`
          : `Failed test — ${args.title}`,
        description: `${args.percentage}%`,
        meta: {
          quizId: args.quizId,
          percentage: args.percentage,
          passed: args.passed,
        },
      },
      tx,
    );

    if (args.timeSpentSec > 0) {
      await tx.user.update({
        where: { id: args.userId },
        data: {
          totalLearningSec: {
            increment: Math.min(args.timeSpentSec, 3 * 3600),
          },
        },
      });
    }
  });

  if (args.subtopicId) {
    const sub = await prisma.subtopic.findUnique({
      where: { id: args.subtopicId },
      include: {
        lesson: { select: { id: true } },
        practice: { select: { id: true } },
        progress: { where: { userId: args.userId }, take: 1 },
      },
    });
    if (sub) {
      const current = sub.progress[0];
      const bestScore = Math.max(current?.bestScore ?? 0, args.percentage);
      const hasLesson = !!sub.lesson;
      const hasPractice = !!sub.practice;
      const lessonDone = current?.lessonDone ?? false;
      const practiceDone = current?.practiceDone ?? false;
      const lessonOk = hasLesson ? lessonDone : true;
      const practiceOk = hasPractice ? practiceDone : true;
      const testPassed = args.passed || (current?.testPassed ?? false);
      const percent = subtopicPercent({
        hasLesson,
        hasPractice,
        hasTest: true,
        lessonDone: lessonOk,
        practiceDone: practiceOk,
        testPassed,
      });
      const status = resolveSubtopicStatus({
        previousUnlocked: current?.status !== ProgressStatus.LOCKED,
        percent,
        lessonDone: lessonOk,
        practiceDone: practiceOk,
        testPassed,
        bestScore,
      });

      await prisma.subtopicProgress.upsert({
        where: {
          userId_subtopicId: { userId: args.userId, subtopicId: args.subtopicId },
        },
        create: {
          userId: args.userId,
          subtopicId: args.subtopicId,
          status:
            current?.status === ProgressStatus.LOCKED
              ? ProgressStatus.LOCKED
              : status,
          progressPercent: percent,
          lessonDone,
          practiceDone,
          testPassed,
          bestScore: args.percentage,
          latestScore: args.percentage,
          attemptsCount: 1,
          startedAt: new Date(),
          lastActivityAt: new Date(),
          completedAt:
            status === ProgressStatus.COMPLETED ||
            status === ProgressStatus.MASTERED
              ? new Date()
              : null,
        },
        update: {
          testPassed,
          bestScore,
          latestScore: args.percentage,
          attemptsCount: { increment: 1 },
          progressPercent: percent,
          status:
            current?.status === ProgressStatus.LOCKED
              ? ProgressStatus.LOCKED
              : status,
          lastActivityAt: new Date(),
          completedAt:
            status === ProgressStatus.COMPLETED ||
            status === ProgressStatus.MASTERED
              ? current?.completedAt ?? new Date()
              : undefined,
        },
      });

      await ensureTopicUnlockState(args.userId, sub.topicId);
    }
  }

  if (args.vocabularyTopicId && args.passed) {
    const topic = await prisma.vocabularyTopic.findUnique({
      where: { id: args.vocabularyTopicId },
      include: { _count: { select: { words: true } } },
    });
    if (topic) {
      const existing = await prisma.vocabularyTopicProgress.findUnique({
        where: {
          userId_topicId: {
            userId: args.userId,
            topicId: args.vocabularyTopicId,
          },
        },
      });
      await prisma.vocabularyTopicProgress.upsert({
        where: {
          userId_topicId: {
            userId: args.userId,
            topicId: args.vocabularyTopicId,
          },
        },
        create: {
          userId: args.userId,
          topicId: args.vocabularyTopicId,
          status: ProgressStatus.COMPLETED,
          wordsLearned: existing?.wordsLearned ?? 0,
          wordsTotal: topic._count.words,
          bestScore: args.percentage,
          attemptsCount: 1,
          completedAt: new Date(),
        },
        update: {
          status: ProgressStatus.COMPLETED,
          bestScore: Math.max(existing?.bestScore ?? 0, args.percentage),
          attemptsCount: { increment: 1 },
          completedAt: existing?.completedAt ?? new Date(),
        },
      });
    }
  }

  if (args.readingTextId && args.passed) {
    const existing = await prisma.readingProgress.findUnique({
      where: {
        userId_readingId: { userId: args.userId, readingId: args.readingTextId },
      },
    });
    await prisma.readingProgress.upsert({
      where: {
        userId_readingId: { userId: args.userId, readingId: args.readingTextId },
      },
      create: {
        userId: args.userId,
        readingId: args.readingTextId,
        status: ProgressStatus.COMPLETED,
        bestScore: args.percentage,
        attemptsCount: 1,
        completedAt: new Date(),
      },
      update: {
        status: ProgressStatus.COMPLETED,
        bestScore: Math.max(existing?.bestScore ?? 0, args.percentage),
        attemptsCount: { increment: 1 },
        completedAt: existing?.completedAt ?? new Date(),
      },
    });
  }

  if (args.listeningTaskId && args.passed) {
    const existing = await prisma.listeningProgress.findUnique({
      where: {
        userId_listeningId: {
          userId: args.userId,
          listeningId: args.listeningTaskId,
        },
      },
    });
    await prisma.listeningProgress.upsert({
      where: {
        userId_listeningId: {
          userId: args.userId,
          listeningId: args.listeningTaskId,
        },
      },
      create: {
        userId: args.userId,
        listeningId: args.listeningTaskId,
        status: ProgressStatus.COMPLETED,
        bestScore: args.percentage,
        attemptsCount: 1,
        completedAt: new Date(),
      },
      update: {
        status: ProgressStatus.COMPLETED,
        bestScore: Math.max(existing?.bestScore ?? 0, args.percentage),
        attemptsCount: { increment: 1 },
        completedAt: existing?.completedAt ?? new Date(),
      },
    });
  }

  if (args.speakingTaskId && args.passed) {
    const existing = await prisma.speakingProgress.findUnique({
      where: {
        userId_taskId: { userId: args.userId, taskId: args.speakingTaskId },
      },
    });
    await prisma.speakingProgress.upsert({
      where: {
        userId_taskId: { userId: args.userId, taskId: args.speakingTaskId },
      },
      create: {
        userId: args.userId,
        taskId: args.speakingTaskId,
        status: ProgressStatus.COMPLETED,
        bestScore: args.percentage,
        attemptsCount: 1,
        completedAt: new Date(),
      },
      update: {
        status: ProgressStatus.COMPLETED,
        bestScore: Math.max(existing?.bestScore ?? 0, args.percentage),
        attemptsCount: { increment: 1 },
        completedAt: existing?.completedAt ?? new Date(),
      },
    });
  }

  if (args.topicId) await recalculateTopicProgress(args.userId, args.topicId);
  if (args.categoryId) {
    await recalculateCategoryProgress(args.userId, args.categoryId);
  }
  if (args.levelId) await recalculateLevelProgress(args.userId, args.levelId);
}

export async function markWordLearnedDb(userId: string, wordId: string) {
  const word = await prisma.vocabularyWord.findUnique({
    where: { id: wordId },
    include: { topic: true },
  });
  if (!word) throw new Error("Word not found");

  const existing = await prisma.userVocabulary.findUnique({
    where: { userId_wordId: { userId, wordId } },
  });

  await prisma.userVocabulary.upsert({
    where: { userId_wordId: { userId, wordId } },
    create: {
      userId,
      wordId,
      known: true,
      status: "learned",
      timesSeen: 1,
      correctAnswers: 1,
      reviewCount: 1,
      learnedAt: new Date(),
      lastReviewAt: new Date(),
      nextReviewAt: new Date(Date.now() + 86_400_000),
      reviewInterval: 1,
    },
    update: {
      known: true,
      status: "learned",
      timesSeen: { increment: 1 },
      correctAnswers: { increment: 1 },
      reviewCount: { increment: 1 },
      learnedAt: existing?.learnedAt ?? new Date(),
      lastReviewAt: new Date(),
      nextReviewAt: new Date(Date.now() + 2 * 86_400_000),
      reviewInterval: Math.max(existing?.reviewInterval ?? 1, 2),
    },
  });

  if (word.topicId) {
    const learned = await prisma.userVocabulary.count({
      where: {
        userId,
        known: true,
        word: { topicId: word.topicId },
      },
    });
    const total = await prisma.vocabularyWord.count({
      where: { topicId: word.topicId, isPublished: true },
    });
    await prisma.vocabularyTopicProgress.upsert({
      where: { userId_topicId: { userId, topicId: word.topicId } },
      create: {
        userId,
        topicId: word.topicId,
        status:
          learned >= total && total > 0
            ? ProgressStatus.COMPLETED
            : ProgressStatus.IN_PROGRESS,
        wordsLearned: learned,
        wordsTotal: total,
      },
      update: {
        wordsLearned: learned,
        wordsTotal: total,
        status:
          learned >= total && total > 0
            ? ProgressStatus.COMPLETED
            : ProgressStatus.IN_PROGRESS,
        completedAt:
          learned >= total && total > 0 ? new Date() : undefined,
      },
    });
  }

  await recordMeaningfulActivity(userId, {
    type: "word_learned",
    title: `Learned word — ${word.word}`,
    description: word.translationRu,
    meta: { wordId },
  });
}

export async function getSubtopicProgressSnapshot(
  userId: string,
  subtopicId: string,
) {
  return prisma.subtopicProgress.findUnique({
    where: { userId_subtopicId: { userId, subtopicId } },
  });
}

export type DashboardProgress = {
  overallPercent: number;
  currentLevel: string;
  lessonsCompleted: number;
  topicsCompleted: number;
  subtopicsCompleted: number;
  testsCompleted: number;
  testsPassed: number;
  averageScore: number;
  wordsLearned: number;
  learningTimeSec: number;
  currentStreak: number;
  longestStreak: number;
  skills: Array<{
    key: string;
    title: string;
    percent: number;
    done: number;
    total: number;
  }>;
  levels: Array<{
    code: string;
    slug: string;
    name: string;
    percent: number;
    status: string;
  }>;
  categories: Array<{
    type: string;
    name: string;
    percent: number;
    topicsDone: number;
    topicsTotal: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    createdAt: string;
  }>;
  streakDays: boolean[];
  continueHref: string;
  continueLabel: string;
};

export async function getDashboardProgress(
  userId: string,
): Promise<DashboardProgress> {
  const [
    user,
    levelRows,
    categoryRows,
    topicDone,
    subtopicDone,
    lessonsDone,
    attempts,
    wordsLearned,
    recentActivity,
    activityDays,
    vocabTopics,
    reading,
    listening,
    speaking,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.level.findMany({
      orderBy: { order: "asc" },
      include: { progress: { where: { userId }, take: 1 } },
    }),
    prisma.categoryProgress.findMany({
      where: { userId },
      include: { category: true },
    }),
    prisma.topicProgress.count({
      where: { userId, status: TopicStatus.COMPLETED },
    }),
    prisma.subtopicProgress.count({
      where: {
        userId,
        status: { in: [ProgressStatus.COMPLETED, ProgressStatus.MASTERED] },
      },
    }),
    prisma.subtopicProgress.count({
      where: { userId, lessonDone: true },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
    }),
    prisma.userVocabulary.count({ where: { userId, known: true } }),
    prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.activityDay.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 14,
    }),
    prisma.vocabularyTopicProgress.findMany({ where: { userId } }),
    prisma.readingProgress.findMany({ where: { userId } }),
    prisma.listeningProgress.findMany({ where: { userId } }),
    prisma.speakingProgress.findMany({ where: { userId } }),
  ]);

  const levelPercents = levelRows.map((l) => l.progress[0]?.percent ?? 0);
  const overallPercent =
    levelPercents.length > 0
      ? Math.round(
          (levelPercents.reduce((a, b) => a + b, 0) / levelPercents.length) * 10,
        ) / 10
      : 0;

  const testsCompleted = attempts.length;
  const testsPassed = attempts.filter((a) => a.passed).length;
  const averageScore =
    attempts.length > 0
      ? Math.round(
          (attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) * 10,
        ) / 10
      : 0;

  // Build Mon–Sun streak flags for current week (UTC)
  const now = new Date();
  const day = now.getUTCDay(); // 0 Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = startOfUtcDay(
    new Date(now.getTime() + mondayOffset * 86_400_000),
  );
  const daySet = new Set(
    activityDays.map((d) => startOfUtcDay(d.date).toISOString()),
  );
  const streakDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getTime() + i * 86_400_000);
    return daySet.has(startOfUtcDay(d).toISOString());
  });

  const skillDefs = [
    { key: "grammar", title: "Grammar", type: CategoryType.GRAMMAR },
    { key: "vocabulary", title: "Vocabulary", type: CategoryType.VOCABULARY },
    { key: "reading", title: "Reading", type: CategoryType.READING },
    { key: "listening", title: "Listening", type: CategoryType.LISTENING },
    { key: "writing", title: "Writing", type: CategoryType.WRITING },
    { key: "speaking", title: "Speaking", type: CategoryType.SPEAKING },
  ] as const;

  const skills = skillDefs.map((def) => {
    const rows = categoryRows.filter((c) => c.category.type === def.type);
    if (rows.length === 0) {
      // Fall back to skill-content progress for vocab/reading/listening/speaking
      if (def.key === "vocabulary") {
        const done = vocabTopics.filter(
          (v) => v.status === ProgressStatus.COMPLETED,
        ).length;
        const total = Math.max(vocabTopics.length, 1);
        const percent =
          vocabTopics.length === 0
            ? 0
            : Math.round(
                (vocabTopics.reduce(
                  (s, v) =>
                    s +
                    (v.wordsTotal > 0
                      ? (v.wordsLearned / v.wordsTotal) * 100
                      : 0),
                  0,
                ) /
                  vocabTopics.length) *
                  10,
              ) / 10;
        return {
          key: def.key,
          title: def.title,
          percent,
          done,
          total: vocabTopics.length,
        };
      }
      if (def.key === "reading") {
        const done = reading.filter(
          (r) => r.status === ProgressStatus.COMPLETED,
        ).length;
        return {
          key: def.key,
          title: def.title,
          percent: reading.length
            ? Math.round((done / reading.length) * 1000) / 10
            : 0,
          done,
          total: reading.length,
        };
      }
      if (def.key === "listening") {
        const done = listening.filter(
          (r) => r.status === ProgressStatus.COMPLETED,
        ).length;
        return {
          key: def.key,
          title: def.title,
          percent: listening.length
            ? Math.round((done / listening.length) * 1000) / 10
            : 0,
          done,
          total: listening.length,
        };
      }
      if (def.key === "speaking") {
        const done = speaking.filter(
          (r) => r.status === ProgressStatus.COMPLETED,
        ).length;
        return {
          key: def.key,
          title: def.title,
          percent: speaking.length
            ? Math.round((done / speaking.length) * 1000) / 10
            : 0,
          done,
          total: speaking.length,
        };
      }
      return { key: def.key, title: def.title, percent: 0, done: 0, total: 0 };
    }
    const percent =
      Math.round(
        (rows.reduce((s, r) => s + r.percent, 0) / rows.length) * 10,
      ) / 10;
    return {
      key: def.key,
      title: def.title,
      percent,
      done: rows.reduce((s, r) => s + r.topicsDone, 0),
      total: rows.reduce((s, r) => s + r.topicsTotal, 0),
    };
  });

  const continueSkill =
    skills.find((s) => s.percent < 100 && s.percent > 0) ?? skills[0]!;
  const continueHref =
    continueSkill.key === "grammar"
      ? "/grammar"
      : `/${continueSkill.key}`;

  return {
    overallPercent,
    currentLevel: user?.currentLevel ?? "A1",
    lessonsCompleted: lessonsDone,
    topicsCompleted: topicDone,
    subtopicsCompleted: subtopicDone,
    testsCompleted,
    testsPassed,
    averageScore,
    wordsLearned,
    learningTimeSec: user?.totalLearningSec ?? 0,
    currentStreak: user?.streak ?? 0,
    longestStreak: user?.longestStreak ?? 0,
    skills,
    levels: levelRows.map((l) => ({
      code: l.code,
      slug: l.slug,
      name: l.name,
      percent: l.progress[0]?.percent ?? 0,
      status: l.progress[0]?.status ?? ProgressStatus.AVAILABLE,
    })),
    categories: categoryRows.map((c) => ({
      type: c.category.type,
      name: c.category.name,
      percent: c.percent,
      topicsDone: c.topicsDone,
      topicsTotal: c.topicsTotal,
    })),
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description,
      createdAt: a.createdAt.toISOString(),
    })),
    streakDays,
    continueHref,
    continueLabel: continueSkill.title,
  };
}

export async function getTestHistory(userId: string) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    include: { quiz: { select: { title: true, passScore: true } } },
    orderBy: { completedAt: "desc" },
    take: 100,
  });

  // Group by quiz for attempt counts
  const counts = new Map<string, number>();
  for (const a of attempts) {
    counts.set(a.quizId, (counts.get(a.quizId) ?? 0) + 1);
  }

  return attempts.map((a) => ({
    id: a.id,
    quizId: a.quizId,
    title: a.quiz.title,
    score: a.percentage,
    correctAnswers: a.correctAnswers,
    wrongAnswers: a.wrongAnswers,
    totalQuestions: a.correctAnswers + a.wrongAnswers,
    passed: a.passed,
    passScore: a.quiz.passScore,
    completedAt: a.completedAt.toISOString(),
    attempts: counts.get(a.quizId) ?? 1,
  }));
}

export async function getAdminUserProgressList() {
  const users = await prisma.user.findMany({
    orderBy: { lastActiveAt: "desc" },
    take: 50,
    include: {
      levelProgress: { include: { level: true } },
      _count: {
        select: {
          quizAttempts: true,
          subtopicProgress: true,
          userVocabulary: true,
        },
      },
    },
  });

  return users.map((u) => {
    const percents = u.levelProgress.map((p) => p.percent);
    const overall =
      percents.length > 0
        ? Math.round(
            (percents.reduce((a, b) => a + b, 0) / percents.length) * 10,
          ) / 10
        : 0;
    return {
      id: u.id,
      name: u.name ?? u.username,
      email: u.email,
      currentLevel: u.currentLevel,
      streak: u.streak,
      overall,
      tests: u._count.quizAttempts,
      subtopics: u._count.subtopicProgress,
      words: u._count.userVocabulary,
      lastActivityAt: u.lastActiveAt?.toISOString() ?? null,
    };
  });
}
