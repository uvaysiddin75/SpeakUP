"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CircularProgress } from "@/components/ui/circular-progress";
import { cn } from "@/lib/utils";
import type { PublicQuestion } from "@/services/quiz-service";

type QuizPlayerProps = {
  quizId: string;
  title: string;
  passScore: number;
  questions: PublicQuestion[];
};

type GradeResult = {
  attemptId: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  percentage: number;
  timeSpentSec: number;
  passed: boolean;
  passScore: number;
  title: string;
  details: Array<{
    questionId: string;
    prompt: string;
    userAnswer: unknown;
    correctAnswer: unknown;
    explanation: string | null;
    isCorrect: boolean;
  }>;
};

function formatAnswer(value: unknown): string {
  if (Array.isArray(value)) return value.join(" / ");
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function QuizPlayer({
  quizId,
  title,
  passScore,
  questions,
}: QuizPlayerProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [selected, setSelected] = useState<unknown>(null);
  const [revealed, setRevealed] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [result, setResult] = useState<GradeResult | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: unknown;
    explanation: string | null;
  } | null>(null);

  const question = questions[index];
  const progress = Math.round(((index + (revealed ? 1 : 0)) / questions.length) * 100);

  const options = useMemo(() => {
    if (!question) return [] as string[];
    if (Array.isArray(question.options)) {
      return question.options.map(String);
    }
    if (question.type === "TRUE_FALSE") return ["True", "False"];
    return [] as string[];
  }, [question]);

  if (!question && !result) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No questions available for this test yet.
        </CardContent>
      </Card>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="overflow-hidden">
          <div className="speakup-hero-panel px-6 py-8 text-center text-white">
            <CircularProgress
              value={result.percentage}
              label={result.passed ? "Passed" : "Retry"}
              className="mx-auto"
              light
            />
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
              {result.percentage}%
            </h1>
            <p className="mt-1 text-lg font-semibold text-white/95">
              {result.passed ? "Great job! 🎉" : "Keep practicing"}
            </p>
            <p className="mt-1 text-sm text-white/75">{result.title}</p>
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Correct" value={String(result.correctAnswers)} />
              <Stat label="Wrong" value={String(result.wrongAnswers)} />
              <Stat label="Score" value={`${result.score}`} />
              <Stat label="Time" value={formatTime(result.timeSpentSec)} />
            </div>
            <p
              className={cn(
                "rounded-xl px-4 py-3 text-sm font-semibold",
                result.passed
                  ? "bg-success/15 text-success"
                  : "bg-danger/15 text-danger",
              )}
              role="status"
            >
              {result.passed
                ? "✓ Completed — you passed this test."
                : `You need ${result.passScore}% to complete this test. Try again.`}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setReviewOpen((v) => !v)}>
                {reviewOpen ? "Hide answers" : "Review Answers"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setResult(null);
                  setIndex(0);
                  setAnswers({});
                  setSelected(null);
                  setRevealed(false);
                  setFeedback(null);
                  setReviewOpen(false);
                }}
              >
                Try Again
              </Button>
              <Button onClick={() => router.back()}>Continue Learning</Button>
            </div>
          </CardContent>
        </Card>

        {reviewOpen ? (
          <div className="space-y-3">
            {result.details.map((item, i) => (
              <Card key={item.questionId}>
                <CardContent className="space-y-2 p-5">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Question {i + 1}
                  </p>
                  <p className="font-medium">{item.prompt}</p>
                  <p className={item.isCorrect ? "text-success" : "text-danger"}>
                    Your answer: {formatAnswer(item.userAnswer)}
                    <span className="sr-only">
                      {item.isCorrect ? " correct" : " incorrect"}
                    </span>
                  </p>
                  {!item.isCorrect ? (
                    <p className="text-sm">
                      Correct: {formatAnswer(item.correctAnswer)}
                    </p>
                  ) : null}
                  {item.explanation ? (
                    <p className="text-sm text-muted-foreground">{item.explanation}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const currentAnswer = selected;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Question {index + 1} / {questions.length}
        </h1>
        <div className="mt-3">
          <ProgressBar value={progress} label="Progress" />
        </div>
      </div>

      <Card>
        <CardContent className="space-y-5 p-6">
          <p className="text-lg font-medium leading-relaxed">{question!.prompt}</p>

          {options.length > 0 ? (
            <div className="space-y-2" role="listbox" aria-label="Answer options">
              {options.map((option) => {
                const active = selected === option;
                const showCorrect =
                  revealed &&
                  feedback &&
                  String(feedback.correctAnswer).toLowerCase() ===
                    option.toLowerCase();
                const showWrong = revealed && active && feedback && !feedback.isCorrect;
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={revealed || pending}
                    onClick={() => setSelected(option)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all",
                      active && !revealed && "border-primary bg-primary/10 shadow-sm",
                      showCorrect && "border-success bg-success/15 text-success",
                      showWrong && "border-danger bg-danger/15 text-danger",
                      !active && !showCorrect && "border-border hover:border-primary/30 hover:bg-muted",
                    )}
                  >
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-current/30 text-[10px]" aria-hidden>
                      ○
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
              placeholder="Type your answer"
              value={typeof selected === "string" ? selected : ""}
              disabled={revealed || pending}
              onChange={(event) => setSelected(event.target.value)}
            />
          )}

          {feedback ? (
            <div
              className={cn(
                "rounded-xl px-4 py-3 text-sm",
                feedback.isCorrect
                  ? "bg-success/15 text-success"
                  : "bg-danger/15 text-danger",
              )}
            >
              <p className="font-semibold">
                {feedback.isCorrect ? "Correct" : "Incorrect"}
              </p>
              {!feedback.isCorrect ? (
                <p className="mt-1">
                  Correct answer: {formatAnswer(feedback.correctAnswer)}
                </p>
              ) : null}
              {feedback.explanation ? (
                <p className="mt-1 opacity-90">{feedback.explanation}</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {!revealed ? (
              <Button
                disabled={selected === null || selected === "" || pending}
                onClick={() => {
                  startTransition(async () => {
                    const response = await fetch("/api/quiz/check", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        questionId: question!.id,
                        userAnswer: currentAnswer,
                      }),
                    });
                    if (!response.ok) return;
                    const data = (await response.json()) as {
                      isCorrect: boolean;
                      correctAnswer: unknown;
                      explanation: string | null;
                    };
                    setAnswers((prev) => ({
                      ...prev,
                      [question!.id]: currentAnswer,
                    }));
                    setFeedback(data);
                    setRevealed(true);
                  });
                }}
              >
                {pending ? "Checking…" : "Check"}
              </Button>
            ) : index < questions.length - 1 ? (
              <Button
                onClick={() => {
                  setIndex((value) => value + 1);
                  setSelected(null);
                  setRevealed(false);
                  setFeedback(null);
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const payload = {
                      quizId,
                      timeSpentSec: Math.max(
                        1,
                        Math.round((Date.now() - startedAt) / 1000),
                      ),
                      answers: questions.map((item) => ({
                        questionId: item.id,
                        userAnswer: answers[item.id] ?? null,
                      })),
                    };
                    const response = await fetch("/api/quiz/grade", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    if (!response.ok) {
                      throw new Error("Failed to grade quiz");
                    }
                    const data = (await response.json()) as GradeResult;
                    setResult(data);
                  });
                }}
              >
                {pending ? "Calculating…" : "See results"}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Passing score: {passScore}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}

function formatTime(totalSec: number) {
  const minutes = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSec % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
