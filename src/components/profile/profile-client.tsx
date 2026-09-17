"use client";

import { Link } from "@/i18n/navigation";
import {
  Award,
  BookMarked,
  Flame,
  Headphones,
  Languages,
  Mic,
  Settings,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

const ACHIEVEMENTS = [
  { icon: Flame, title: "7 Day Streak", unlocked: true },
  { icon: Trophy, title: "First Test", unlocked: true },
  { icon: Languages, title: "100 Words", unlocked: false },
  { icon: Headphones, title: "Listening Master", unlocked: false },
  { icon: Mic, title: "Speaking Starter", unlocked: true },
  { icon: BookMarked, title: "Reading Pro", unlocked: false },
];

export function ProfileClient() {
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
                SU
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">SpeakUp Learner</h1>
                <p className="text-sm text-muted-foreground">Current level · B1 Intermediate</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="primary">1,240 XP</Badge>
                  <Badge variant="accent">🔥 12 day streak</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/settings">
                  <Settings className="mr-1.5 h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <Button size="sm" variant="secondary">
                Edit Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Lessons completed", value: "86" },
          { label: "Words learned", value: "340" },
          { label: "Tests passed", value: "24" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Learning progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { title: "Vocabulary", value: 68 },
            { title: "Reading", value: 54 },
            { title: "Listening", value: 47 },
            { title: "Speaking", value: 39 },
          ].map((row) => (
            <ProgressBar key={row.title} value={row.value} label={row.title} />
          ))}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 font-display text-xl font-bold">Achievements</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className={cn(!item.unlocked && "opacity-45 grayscale")}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <span
                    className={cn(
                      "rounded-xl p-2.5",
                      item.unlocked ? "bg-primary/15 text-primary" : "bg-muted",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.unlocked ? "Unlocked" : "Locked"}
                    </p>
                  </div>
                  {item.unlocked ? (
                    <Award className="ml-auto h-4 w-4 text-warning" aria-hidden />
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>✓ Completed Vocabulary · Family test</p>
          <p>✓ Finished Reading · My Family</p>
          <p>✓ Practiced Speaking · Daily Routine</p>
        </CardContent>
      </Card>
    </div>
  );
}
