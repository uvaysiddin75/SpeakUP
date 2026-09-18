"use client";

import { Link } from "@/i18n/navigation";
import {
  BookMarked,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Headphones,
  Languages,
  Mic,
  PenLine,
  SpellCheck2,
  Sparkles,
} from "lucide-react";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/ui/circular-progress";
import type { DashboardProgress } from "@/services/progress-service";
import { cn } from "@/lib/utils";

const SKILL_ICONS: Record<string, typeof Languages> = {
  grammar: SpellCheck2,
  vocabulary: Languages,
  reading: BookMarked,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic,
};

const QUICK_ACTIONS = [
  { href: "/courses", title: "Courses", icon: BookOpen },
  { href: "/grammar", title: "Grammar", icon: SpellCheck2 },
  { href: "/vocabulary", title: "Vocabulary", icon: Languages },
  { href: "/writing", title: "Writing", icon: PenLine },
  { href: "/speaking", title: "Speaking", icon: Mic },
  { href: "/tests", title: "Tests", icon: ClipboardCheck },
] as const;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatLearningTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatActivityTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function DashboardClient({
  data,
  authenticated,
  userName,
}: {
  data: DashboardProgress;
  authenticated: boolean;
  userName: string | null;
}) {
  const name = userName?.split(" ")[0] || "Learner";
  const continueSkill =
    data.skills.find((s) => s.percent > 0 && s.percent < 100) ?? data.skills[0];

  return (
    <div className="relative space-y-6">
      <div className="dashboard-blobs" aria-hidden>
        <span className="animate-float-soft left-[-8%] top-8 h-48 w-48 bg-primary/30" />
        <span className="animate-float-delayed right-[-5%] top-40 h-56 w-56 bg-accent/25" />
        <span className="animate-float-soft bottom-20 left-1/3 h-40 w-40 bg-secondary/20" />
      </div>

      <div className="relative z-[1] space-y-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {greeting()}, {name}
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Your English App
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {authenticated
                ? "Real progress from your lessons, practice and tests."
                : "Sign in to save real progress across devices."}
            </p>
          </div>
          <Badge variant="primary" className="animate-count-pop">
            Overall {data.overallPercent}%
          </Badge>
        </Reveal>

        {!authenticated ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <p className="text-sm text-muted-foreground">
                Progress starts at 0% until you sign in and complete real learning
                activities.
              </p>
              <Button asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Reveal animation="scale-in">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/10">
            <CardContent className="grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary">{data.currentLevel}</Badge>
                  <Badge variant="accent">Continue</Badge>
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  Continue where you left off
                </h2>
                <p className="text-sm text-muted-foreground">
                  {data.continueLabel} · next step in your path.
                </p>
                <ProgressBar
                  value={continueSkill?.percent ?? 0}
                  label="Skill progress"
                />
                <Button asChild>
                  <Link href={data.continueHref}>Continue</Link>
                </Button>
              </div>
              <CircularProgress
                value={data.overallPercent}
                label="Overall"
              />
            </CardContent>
          </Card>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Lessons", value: data.lessonsCompleted },
            { label: "Tests passed", value: data.testsPassed },
            { label: "Words learned", value: data.wordsLearned },
            { label: "Avg score", value: `${data.averageScore}%` },
          ].map((stat) => (
            <Card key={stat.label} interactive>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 font-display text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Reveal>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-display text-xl font-bold">Quick launch</h2>
            </div>
            <Stagger
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
              stepMs={60}
            >
              {QUICK_ACTIONS.map(({ href, title, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-3 py-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-hover)]"
                >
                  <span className="rounded-xl bg-primary/10 p-2.5 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold">{title}</span>
                </Link>
              ))}
            </Stagger>
          </div>
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Stagger className="grid gap-4 sm:grid-cols-2" stepMs={80}>
            {data.skills.map((skill) => {
              const Icon = SKILL_ICONS[skill.key] ?? BookOpen;
              return (
                <Card
                  key={skill.key}
                  interactive
                  className="transition-transform duration-300 hover:-translate-y-1"
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="card-icon rounded-xl bg-primary/10 p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      {skill.title}
                    </CardTitle>
                    <span className="text-sm font-bold tabular-nums">
                      {skill.percent}%
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ProgressBar value={skill.percent} showValue={false} />
                    <p className="text-xs text-muted-foreground">
                      {skill.done} / {skill.total || "—"} completed
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={
                          skill.key === "grammar" ? "/grammar" : `/${skill.key}`
                        }
                      >
                        Open
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </Stagger>

          <Reveal animation="slide-left" delayMs={120}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="animate-fire" aria-hidden>
                    {"🔥".repeat(Math.min(3, Math.max(1, data.currentStreak || 1)))}
                  </span>
                  {data.currentStreak} Day Streak
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-7 gap-1.5">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day, i) => (
                      <div key={day} className="text-center">
                        <div
                          className={cn(
                            "mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                            data.streakDays[i]
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {data.streakDays[i] ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            day[0]
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">{day}</p>
                      </div>
                    ),
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-muted/70 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Best streak</p>
                    <p className="font-semibold">{data.longestStreak} days</p>
                  </div>
                  <div className="rounded-xl bg-muted/70 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Learning time</p>
                    <p className="font-semibold">
                      {formatLearningTime(data.learningTimeSec)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>

        <div>
          <Reveal className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-display text-xl font-bold">Your levels</h2>
          </Reveal>
          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" stepMs={70}>
            {(data.levels.length
              ? data.levels
              : ["A1", "A2", "B1", "B2", "C1", "C2"].map((code) => ({
                  code,
                  slug: code.toLowerCase(),
                  name: code,
                  percent: 0,
                  status: "AVAILABLE",
                }))
            ).map((level, index) => (
              <Card
                key={level.code}
                interactive
                className={cn(
                  "transition-all duration-300 hover:-translate-y-1",
                  level.code === data.currentLevel && "ring-2 ring-primary/40",
                )}
              >
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        level.code === data.currentLevel ? "primary" : "default"
                      }
                    >
                      {level.code}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{level.name}</span>
                  </div>
                  <ProgressBar value={level.percent} showValue />
                  <Button
                    asChild
                    size="sm"
                    variant={index === 0 ? "primary" : "outline"}
                  >
                    <Link href={`/courses/${level.slug}`}>
                      {level.percent > 0 ? "Continue" : "Open"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stagger>
        </div>

        <Reveal>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent activity</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/progress">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.recentActivity.length === 0 ? (
                <p className="text-muted-foreground">
                  No activity yet. Start learning to build your path.
                </p>
              ) : (
                data.recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{item.title}</p>
                      {item.description ? (
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {formatActivityTime(item.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
