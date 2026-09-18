"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useUxOptional } from "@/components/providers/ux-provider";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

export type PracticeItemView = {
  id: string;
  prompt: string;
  options: unknown;
  explanation: string | null;
};

type Props = {
  practiceId: string;
  title: string;
  items: PracticeItemView[];
  lessonHref: string;
  testHref: string;
  guestMode?: boolean;
};

export function PracticePlayer({
  practiceId,
  title,
  items,
  lessonHref,
  testHref,
  guestMode = false,
}: Props) {
  const router = useRouter();
  const ux = useUxOptional();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    percentage: number;
    correctAnswers: number;
    total: number;
    passed: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v.trim().length > 0).length,
    [answers],
  );

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No practice items yet.
        </CardContent>
      </Card>
    );
  }

  if (result) {
    return (
      <Card className="animate-scale-in">
        <CardContent className="space-y-4 p-6 text-center">
          <p className="font-display text-3xl font-bold">{result.percentage}%</p>
          <p
            className={cn(
              "font-semibold",
              result.passed ? "text-success" : "text-danger",
            )}
          >
            {result.passed ? "Practice completed ✓" : "Keep practicing"}
          </p>
          <p className="text-sm text-muted-foreground">
            {result.correctAnswers}/{result.total} correct
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {!result.passed ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                }}
              >
                Try again
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href={lessonHref}>Back to lesson</Link>
            </Button>
            <Button asChild>
              <Link href={testHref}>Start test</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ProgressBar
        value={Math.round((answeredCount / items.length) * 100)}
        label={`${title} · ${answeredCount}/${items.length}`}
      />
      {items.map((item, index) => {
        const options = Array.isArray(item.options)
          ? item.options.map(String)
          : [];
        return (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {index + 1}. {item.prompt}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {options.length > 0 ? (
                options.map((option) => {
                  const active = answers[item.id] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [item.id]: option }))
                      }
                      className={cn(
                        "w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30 hover:bg-muted",
                      )}
                    >
                      {option}
                    </button>
                  );
                })
              ) : (
                <input
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
                  placeholder="Type your answer"
                  value={answers[item.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [item.id]: e.target.value,
                    }))
                  }
                />
              )}
            </CardContent>
          </Card>
        );
      })}

      {guestMode ? (
        <Button variant="outline" disabled>
          Sign in to save practice progress
        </Button>
      ) : (
        <Button
          loading={loading}
          disabled={answeredCount < items.length}
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              const res = await fetch("/api/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "complete_practice",
                  practiceId,
                  answers: items.map((item) => ({
                    itemId: item.id,
                    userAnswer: answers[item.id] ?? "",
                  })),
                }),
              });
              const data = (await res.json()) as {
                error?: string;
                percentage?: number;
                correctAnswers?: number;
                total?: number;
                passed?: boolean;
              };
              if (!res.ok) {
                setError(data.error ?? "Failed");
                return;
              }
              setResult({
                percentage: data.percentage ?? 0,
                correctAnswers: data.correctAnswers ?? 0,
                total: data.total ?? items.length,
                passed: !!data.passed,
              });
              if (data.passed) {
                ux?.play("correct");
                ux?.toast({
                  title: "Practice completed ✓",
                  description: `${data.percentage}%`,
                  tone: "success",
                  icon: "success",
                });
              } else {
                ux?.play("wrong");
              }
              router.refresh();
            } catch {
              setError("Network error");
            } finally {
              setLoading(false);
            }
          }}
        >
          Submit practice
        </Button>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
