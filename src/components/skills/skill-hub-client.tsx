"use client";

import { useEffect, useMemo, useState } from "react";
import { SkillHub, type SkillHubItem } from "@/components/skills/skill-hub";
import { readGuestProgress, skillPercent } from "@/lib/guest-progress";

type Item = Omit<SkillHubItem, "progressPercent" | "completed" | "locked"> & {
  id: string;
};

export function SkillHubClient({
  title,
  subtitle,
  skill,
  items,
  accent,
}: {
  title: string;
  subtitle: string;
  skill: "vocabulary" | "reading" | "listening" | "speaking";
  items: Item[];
  accent?: string;
}) {
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [bestScores, setBestScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const store = readGuestProgress();
    queueMicrotask(() => {
      setCompleted(store.skills[skill].completedIds);
      setBestScores(store.skills[skill].bestScores);
      setReady(true);
    });
  }, [skill]);

  const hubItems: SkillHubItem[] = useMemo(() => {
    return items.map((item, index) => {
      const isDone = completed.includes(item.id);
      const score = bestScores[item.id];
      return {
        ...item,
        completed: isDone,
        locked: false,
        progressPercent: isDone
          ? 100
          : typeof score === "number"
            ? Math.min(99, score)
            : ready
              ? 0
              : index === 0
                ? 0
                : 0,
      };
    });
  }, [items, completed, bestScores, ready]);

  // silence unused helper warning by referencing
  void skillPercent;

  return (
    <SkillHub title={title} subtitle={subtitle} items={hubItems} accent={accent} />
  );
}
