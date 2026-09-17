"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  BookMarked,
  CheckCircle2,
  Flame,
  Headphones,
  Languages,
  Mic,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/ui/circular-progress";
import { LEVEL_META } from "@/lib/curriculum";
import { readGuestProgress, skillPercent } from "@/lib/guest-progress";
import { cn } from "@/lib/utils";

type Counts = {
  vocabulary: number;
  reading: number;
  listening: number;
  speaking: number;
};

const SKILLS = [
  {
    key: "vocabulary" as const,
    title: "Vocabulary",
    href: "/vocabulary",
    icon: Languages,
    tint: "from-indigo-500/15 to-violet-500/10",
    iconClass: "text-indigo-500",
  },
  {
    key: "reading" as const,
    title: "Reading",
    href: "/reading",
    icon: BookMarked,
    tint: "from-sky-500/15 to-blue-500/10",
    iconClass: "text-sky-500",
  },
  {
    key: "listening" as const,
    title: "Listening",
    href: "/listening",
    icon: Headphones,
    tint: "from-violet-500/15 to-fuchsia-500/10",
    iconClass: "text-violet-500",
  },
  {
    key: "speaking" as const,
    title: "Speaking",
    href: "/speaking",
    icon: Mic,
    tint: "from-orange-500/15 to-amber-500/10",
    iconClass: "text-orange-500",
  },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardClient({ counts }: { counts: Counts }) {
  const [percents, setPercents] = useState<Record<string, number>>({
    vocabulary: 0,
    reading: 0,
    listening: 0,
    speaking: 0,
  });
  const [completed, setCompleted] = useState<Record<string, number>>({
    vocabulary: 0,
    reading: 0,
    listening: 0,
    speaking: 0,
  });
  const [streakDays] = useState(() => [true, true, true, true, false, false, false]);

  useEffect(() => {
    const store = readGuestProgress();
    queueMicrotask(() => {
      setPercents({
        vocabulary: skillPercent(store.skills.vocabulary, counts.vocabulary),
        reading: skillPercent(store.skills.reading, counts.reading),
        listening: skillPercent(store.skills.listening, counts.listening),
        speaking: skillPercent(store.skills.speaking, counts.speaking),
      });
      setCompleted({
        vocabulary: store.skills.vocabulary.completedIds.length,
        reading: store.skills.reading.completedIds.length,
        listening: store.skills.listening.completedIds.length,
        speaking: store.skills.speaking.completedIds.length,
      });
    });
  }, [counts]);

  const continueSkill = useMemo(() => {
    return (
      SKILLS.find((skill) => (percents[skill.key] ?? 0) < 100 && (percents[skill.key] ?? 0) > 0) ??
      SKILLS[0]!
    );
  }, [percents]);

  const overall = useMemo(() => {
    const values = Object.values(percents);
    if (!values.length) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [percents]);

  const streakCount = streakDays.filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{greeting()}, Learner</p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Continue Learning
          </h1>
        </div>
        <Badge variant="primary">Overall {overall}%</Badge>
      </div>

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/10">
        <CardContent className="grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">B1</Badge>
              <Badge variant="accent">Continue</Badge>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Continue where you left off
            </h2>
            <p className="text-sm text-muted-foreground">
              {continueSkill.title} · keep building momentum with your next lesson.
            </p>
            <ProgressBar value={percents[continueSkill.key] ?? 0} label="Progress" />
            <Button asChild>
              <Link href={continueSkill.href}>Continue</Link>
            </Button>
          </div>
          <CircularProgress value={percents[continueSkill.key] ?? 0} label="Ready" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {SKILLS.map((skill) => {
            const Icon = skill.icon;
            const value = percents[skill.key] ?? 0;
            const done = completed[skill.key] ?? 0;
            const total = counts[skill.key] || 1;
            return (
              <Card key={skill.key} className={cn("bg-gradient-to-br", skill.tint)}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="rounded-xl bg-card/80 p-2 shadow-sm">
                        <Icon className={cn("h-4 w-4", skill.iconClass)} />
                      </span>
                      {skill.title}
                    </CardTitle>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{value}%</span>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ProgressBar value={value} showValue={false} />
                  <p className="text-xs text-muted-foreground">
                    {done} / {total} lessons completed
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link href={skill.href}>Continue</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-accent" />
              {streakCount} day streak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-7 gap-1.5">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                <div key={day} className="text-center">
                  <div
                    className={cn(
                      "mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                      streakDays[i]
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                    aria-label={`${day} ${streakDays[i] ? "active" : "inactive"}`}
                  >
                    {streakDays[i] ? <CheckCircle2 className="h-4 w-4" /> : day[0]}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{day}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-muted/70 px-3 py-2">
                <p className="text-xs text-muted-foreground">Best streak</p>
                <p className="font-semibold">12 days</p>
              </div>
              <div className="rounded-xl bg-muted/70 px-3 py-2">
                <p className="text-xs text-muted-foreground">Learning days</p>
                <p className="font-semibold">48</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-display text-xl font-bold">Your levels</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LEVEL_META.map((level, index) => {
            const progress = Math.max(0, Math.min(100, overall - index * 12));
            const current = index === 0 || progress > 0;
            return (
              <Card
                key={level.code}
                className={cn(current && index === 0 && "ring-2 ring-primary/40")}
              >
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <Badge variant={index === 0 ? "primary" : "default"}>{level.code}</Badge>
                    <span className="text-xs text-muted-foreground">{level.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{level.description}</p>
                  <ProgressBar value={Math.max(0, progress)} showValue />
                  <Button asChild size="sm" variant={index === 0 ? "primary" : "outline"}>
                    <Link href={`/courses/${level.slug}`}>
                      {index === 0 ? "Continue" : "Open"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Learning path</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {LEVEL_META.map((level, index) => (
              <li key={level.code} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                      index === 0
                        ? "bg-primary text-primary-foreground"
                        : index < 2
                          ? "bg-success/20 text-success"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {index < 1 ? "→" : index < 2 ? "✓" : "🔒"}
                  </span>
                  {index < LEVEL_META.length - 1 ? (
                    <span className="mt-1 h-6 w-px bg-border" aria-hidden />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2">
                  <p className="font-semibold">
                    {level.code} · {level.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Grammar · Vocabulary · Reading · Listening · Speaking
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
