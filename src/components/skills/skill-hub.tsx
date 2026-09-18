"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { useUxOptional } from "@/components/providers/ux-provider";
import { LevelCompleteModal } from "@/components/ui/level-complete-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

export type SkillHubItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  levelCode: string;
  difficulty: string;
  lessonsCount: number;
  progressPercent: number;
  completed: boolean;
  locked?: boolean;
  href: string;
};

const LEVELS = ["ALL", "A1", "A2", "B1", "B2", "C1", "C2"] as const;

type SkillHubProps = {
  title: string;
  subtitle: string;
  items: SkillHubItem[];
  accent?: string;
};

export function SkillHub({ title, subtitle, items, accent }: SkillHubProps) {
  const ux = useUxOptional();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("ALL");
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);
  const [levelComplete, setLevelComplete] = useState<string | null>(null);
  const [celebratedLevels, setCelebratedLevels] = useState<Set<string>>(
    () => new Set(),
  );
  const [celebrationReady, setCelebrationReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("speakup_celebrated_levels_v1");
      if (raw) {
        setCelebratedLevels(new Set(JSON.parse(raw) as string[]));
      } else {
        // First run: seed already-complete levels silently (no celebration spam).
        const complete = Array.from(
          new Set(
            [...new Set(items.map((i) => i.levelCode))].filter((code) => {
              const list = items.filter((i) => i.levelCode === code);
              return list.length > 0 && list.every((i) => i.completed);
            }),
          ),
        );
        setCelebratedLevels(new Set(complete));
        window.localStorage.setItem(
          "speakup_celebrated_levels_v1",
          JSON.stringify(complete),
        );
      }
    } catch {
      // ignore
    }
    setCelebrationReady(true);
    // only seed on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (level !== "ALL" && item.levelCode !== level) return false;
      if (onlyIncomplete && item.completed) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [items, query, level, onlyIncomplete]);

  const overall =
    items.length === 0
      ? 0
      : Math.round(
          (items.filter((i) => i.completed).length / items.length) * 1000,
        ) / 10;

  useEffect(() => {
    if (!celebrationReady) return;
    const byLevel = new Map<string, SkillHubItem[]>();
    for (const item of items) {
      const list = byLevel.get(item.levelCode) ?? [];
      list.push(item);
      byLevel.set(item.levelCode, list);
    }
    for (const [code, list] of byLevel) {
      if (list.length === 0) continue;
      if (!list.every((item) => item.completed)) continue;
      if (celebratedLevels.has(code)) continue;
      const next = new Set(celebratedLevels).add(code);
      setCelebratedLevels(next);
      try {
        window.localStorage.setItem(
          "speakup_celebrated_levels_v1",
          JSON.stringify([...next]),
        );
      } catch {
        // ignore
      }
      setLevelComplete(code);
      ux?.play("level-complete");
      ux?.celebrate({ intensity: "strong" });
      ux?.toast({
        title: `🏆 ${code} Completed`,
        description: "Achievement unlocked!",
        tone: "achievement",
        icon: "achievement",
      });
      break;
    }
  }, [items, celebratedLevels, ux, celebrationReady]);

  return (
    <div className="space-y-6">
      <LevelCompleteModal
        open={!!levelComplete}
        onClose={() => setLevelComplete(null)}
        levelCode={levelComplete ?? ""}
      />
      <div
        className="overflow-hidden rounded-3xl border border-border p-6 sm:p-8"
        style={{
          background: `linear-gradient(135deg, var(--hero-from), ${accent ?? "var(--hero-to)"})`,
        }}
      >
        <p className="text-sm font-medium text-white/80">SpeakUp Skills</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">{subtitle}</p>
        <div className="mt-5 max-w-md rounded-xl bg-white/15 p-3 backdrop-blur">
          <ProgressBar value={overall} label="Overall progress" showValue />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No lessons yet"
          description="Start learning to see topics and progress here."
          action={
            <Button asChild>
              <Link href="/courses">Start Learning</Link>
            </Button>
          }
        />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            placeholder="Search topics…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant={onlyIncomplete ? "secondary" : "outline"}
          onClick={() => setOnlyIncomplete((v) => !v)}
        >
          {onlyIncomplete ? "Showing incomplete" : "Filter incomplete"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {LEVELS.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLevel(code)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              level === code
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {code}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((item) => (
          <Card
            key={item.id}
            interactive
            className={cn(
              "transition-all duration-200 hover:-translate-y-1",
              item.locked && "opacity-60",
              item.completed && "ring-1 ring-success/40",
            )}
          >
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary" className="card-icon">
                  {item.levelCode}
                </Badge>
                <Badge>{item.difficulty}</Badge>
                {item.completed ? <Badge variant="success">Completed</Badge> : null}
                {item.locked ? <Badge variant="warning">Locked</Badge> : null}
              </div>
              <CardTitle className="mt-2">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {item.lessonsCount} lesson{item.lessonsCount === 1 ? "" : "s"}
              </p>
              <ProgressBar value={item.progressPercent} showValue />
              <Button asChild disabled={item.locked} className="w-full sm:w-auto">
                <Link href={item.href}>{item.completed ? "Review" : "Start"}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No topics match your filters.
        </p>
      ) : null}
    </div>
  );
}
