"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  emptyGuestProgress,
  readGuestProgress,
  type GuestProgressStore,
} from "@/lib/guest-progress";

export function ProgressClient({
  totals,
}: {
  totals: {
    vocabulary: number;
    reading: number;
    listening: number;
    speaking: number;
  };
}) {
  const [store, setStore] = useState<GuestProgressStore>(emptyGuestProgress());

  useEffect(() => {
    queueMicrotask(() => setStore(readGuestProgress()));
  }, []);

  const rows = [
    {
      key: "vocabulary" as const,
      title: "Vocabulary",
      done: store.skills.vocabulary.completedIds.length,
      total: totals.vocabulary,
      words: Object.values(store.skills.vocabulary.wordsLearned ?? {}).reduce(
        (sum, list) => sum + list.length,
        0,
      ),
    },
    {
      key: "reading" as const,
      title: "Reading",
      done: store.skills.reading.completedIds.length,
      total: totals.reading,
    },
    {
      key: "listening" as const,
      title: "Listening",
      done: store.skills.listening.completedIds.length,
      total: totals.listening,
    },
    {
      key: "speaking" as const,
      title: "Speaking",
      done: store.skills.speaking.completedIds.length,
      total: totals.speaking,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Progress</h1>
        <p className="mt-1 text-muted-foreground">
          Completed lessons, best scores, and time spent (saved on this device).
        </p>
      </div>

      <div className="grid gap-4">
        {rows.map((row) => {
          const percent =
            row.total > 0 ? Math.round((row.done / row.total) * 1000) / 10 : 0;
          return (
            <Card key={row.key}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span>{row.title}</span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {row.done}/{row.total}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ProgressBar value={percent} />
                {"words" in row && typeof row.words === "number" ? (
                  <p className="text-xs text-muted-foreground">
                    Words marked learned: {row.words}
                  </p>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-3">
                  {Object.entries(store.skills[row.key].bestScores)
                    .slice(0, 6)
                    .map(([id, score]) => (
                      <div key={id} className="rounded-xl bg-muted px-3 py-2 text-xs">
                        Best score: {score}%
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
