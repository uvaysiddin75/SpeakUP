"use client";

import { Link } from "@/i18n/navigation";
import { Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { DashboardProgress } from "@/services/progress-service";

function formatLearningTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function ProfileClient({
  data,
  authenticated,
  userName,
  email,
}: {
  data: DashboardProgress;
  authenticated: boolean;
  userName: string | null;
  email: string | null;
}) {
  const initials = (userName || "SU")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="speakup-hero-panel h-28" />
        <CardContent className="-mt-10 space-y-4 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card bg-primary text-2xl font-bold text-primary-foreground shadow-[var(--shadow)]"
                aria-hidden
              >
                {initials}
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  {userName || "SpeakUp Learner"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {email || "Guest"} · Level {data.currentLevel}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="primary">{data.overallPercent}% overall</Badge>
                  <Badge variant="accent">
                    <span className="animate-fire mr-1" aria-hidden>
                      🔥
                    </span>
                    {data.currentStreak} day streak
                  </Badge>
                </div>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings">
                <Settings className="mr-1.5 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {!authenticated ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-muted-foreground">
              Sign in to keep statistics in your account.
            </p>
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Lessons completed", value: String(data.lessonsCompleted) },
          { label: "Words learned", value: String(data.wordsLearned) },
          { label: "Tests passed", value: String(data.testsPassed) },
          { label: "Average score", value: `${data.averageScore}%` },
          { label: "Learning time", value: formatLearningTime(data.learningTimeSec) },
          {
            label: "Longest streak",
            value: `${data.longestStreak} days`,
          },
        ].map((stat) => (
          <Card key={stat.label} interactive>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.skills.map((row) => (
            <ProgressBar key={row.key} value={row.percent} label={row.title} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
