"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveSpeakingSelfEval } from "@/lib/guest-progress";
import { cn } from "@/lib/utils";

const CRITERIA = [
  { key: "pronunciation", label: "Pronunciation" },
  { key: "fluency", label: "Fluency" },
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "confidence", label: "Confidence" },
] as const;

type Scores = Record<(typeof CRITERIA)[number]["key"], number>;

type SpeakingSelfEvalProps = {
  taskId: string;
  onComplete?: (total: number, scores: Scores & { total: number }) => void;
};

export function SpeakingSelfEval({ taskId, onComplete }: SpeakingSelfEvalProps) {
  const [scores, setScores] = useState<Scores>({
    pronunciation: 3,
    fluency: 3,
    grammar: 3,
    vocabulary: 3,
    confidence: 3,
  });
  const [result, setResult] = useState<(Scores & { total: number }) | null>(null);

  if (result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">Speaking Result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CRITERIA.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm"
            >
              <span>{item.label}</span>
              <span className="font-semibold">{result[item.key]}/5</span>
            </div>
          ))}
          <p className="pt-2 font-display text-xl font-bold">
            Total Score: {result.total}%
          </p>
          <p className="text-xs text-muted-foreground">
            Self-evaluation for now. Architecture is ready for Speech-to-Text / AI
            scoring later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Self Evaluation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {CRITERIA.map((item) => (
          <div key={item.key}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground">{scores[item.key]}/5</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setScores((prev) => ({ ...prev, [item.key]: value }))
                  }
                  className={cn(
                    "h-10 flex-1 rounded-xl border text-sm font-semibold transition-colors",
                    scores[item.key] === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}
        <Button
          className="w-full"
          onClick={() => {
            const { total } = saveSpeakingSelfEval(taskId, scores);
            const payload = { ...scores, total };
            setResult(payload);
            onComplete?.(total, payload);
          }}
        >
          Save speaking result
        </Button>
      </CardContent>
    </Card>
  );
}
