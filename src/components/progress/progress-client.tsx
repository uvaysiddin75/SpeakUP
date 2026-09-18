"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Badge } from "@/components/ui/badge";
import type { DashboardProgress } from "@/services/progress-service";

function formatLearningTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function ProgressClient({
  data,
  authenticated,
  tests,
}: {
  data: DashboardProgress;
  authenticated: boolean;
  tests: Array<{
    id: string;
    title: string;
    score: number;
    correctAnswers: number;
    wrongAnswers: number;
    totalQuestions: number;
    passed: boolean;
    completedAt: string;
    attempts: number;
  }>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Progress</h1>
          <p className="mt-1 text-muted-foreground">
            {authenticated
              ? "Calculated from your real lessons, practice and tests in the database."
              : "Sign in to track real progress."}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/progress/tests">Test history</Link>
        </Button>
      </div>

      {!authenticated ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-muted-foreground">
              Overall progress is 0% until you sign in and complete learning activities.
            </p>
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar value={data.overallPercent} label="All levels" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Current level" value={data.currentLevel} />
              <Stat label="Lessons" value={String(data.lessonsCompleted)} />
              <Stat label="Subtopics done" value={String(data.subtopicsCompleted)} />
              <Stat label="Topics done" value={String(data.topicsCompleted)} />
              <Stat label="Tests" value={`${data.testsPassed}/${data.testsCompleted}`} />
              <Stat label="Avg score" value={`${data.averageScore}%`} />
              <Stat label="Words" value={String(data.wordsLearned)} />
              <Stat label="Streak" value={`${data.currentStreak} days`} />
              <Stat label="Time" value={formatLearningTime(data.learningTimeSec)} />
            </div>
          </CardContent>
        </Card>
        <Card className="flex items-center justify-center p-6">
          <CircularProgress value={data.overallPercent} label="Overall" />
        </Card>
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl font-bold">Skills</h2>
        <div className="grid gap-4">
          {data.skills.map((skill) => (
            <Card key={skill.key}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3 text-base">
                  <span>{skill.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {skill.done}/{skill.total || 0}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressBar value={skill.percent} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl font-bold">Levels</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.levels.map((level) => (
            <Card key={level.code} interactive>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <Badge variant="primary">{level.code}</Badge>
                  <span className="text-xs text-muted-foreground">{level.status}</span>
                </div>
                <ProgressBar value={level.percent} />
                <Button asChild size="sm" variant="outline">
                  <Link href={`/courses/${level.slug}`}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl font-bold">Recent tests</h2>
        {tests.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No tests yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tests.slice(0, 8).map((test) => (
              <Card key={test.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{test.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {test.correctAnswers}/{test.totalQuestions} ·{" "}
                      {new Date(test.completedAt).toLocaleDateString()} ·{" "}
                      {test.attempts} attempt(s)
                    </p>
                  </div>
                  <Badge variant={test.passed ? "success" : "danger"}>
                    {test.score}% {test.passed ? "Passed" : "Failed"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl font-bold">Recent activity</h2>
        <Card>
          <CardContent className="space-y-2 p-5 text-sm">
            {data.recentActivity.length === 0 ? (
              <p className="text-muted-foreground">Start learning to see activity here.</p>
            ) : (
              data.recentActivity.map((item) => (
                <div key={item.id} className="rounded-xl bg-muted/40 px-3 py-2">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
