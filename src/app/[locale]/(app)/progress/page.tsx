import { auth } from "@/auth";
import { setRequestLocale } from "next-intl/server";
import { ProgressClient } from "@/components/progress/progress-client";
import {
  getDashboardProgress,
  getTestHistory,
  type DashboardProgress,
} from "@/services/progress-service";

function empty(): DashboardProgress {
  return {
    overallPercent: 0,
    currentLevel: "A1",
    lessonsCompleted: 0,
    topicsCompleted: 0,
    subtopicsCompleted: 0,
    testsCompleted: 0,
    testsPassed: 0,
    averageScore: 0,
    wordsLearned: 0,
    learningTimeSec: 0,
    currentStreak: 0,
    longestStreak: 0,
    skills: [
      { key: "grammar", title: "Grammar", percent: 0, done: 0, total: 0 },
      { key: "vocabulary", title: "Vocabulary", percent: 0, done: 0, total: 0 },
      { key: "reading", title: "Reading", percent: 0, done: 0, total: 0 },
      { key: "listening", title: "Listening", percent: 0, done: 0, total: 0 },
      { key: "writing", title: "Writing", percent: 0, done: 0, total: 0 },
      { key: "speaking", title: "Speaking", percent: 0, done: 0, total: 0 },
    ],
    levels: [],
    categories: [],
    recentActivity: [],
    streakDays: [false, false, false, false, false, false, false],
    continueHref: "/courses",
    continueLabel: "Courses",
  };
}

export default async function ProgressPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const userId = session?.user?.id;
  let data = empty();
  let tests: Awaited<ReturnType<typeof getTestHistory>> = [];

  if (userId) {
    try {
      [data, tests] = await Promise.all([
        getDashboardProgress(userId),
        getTestHistory(userId),
      ]);
    } catch {
      data = empty();
    }
  }

  return (
    <ProgressClient
      data={data}
      authenticated={!!userId}
      tests={tests}
    />
  );
}
