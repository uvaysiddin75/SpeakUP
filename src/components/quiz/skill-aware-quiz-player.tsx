"use client";

import { useEffect, useState } from "react";
import { markLessonComplete } from "@/lib/guest-progress";
import type { PublicQuestion } from "@/services/quiz-service";
import { QuizPlayer } from "@/components/quiz/quiz-player";

type Props = {
  quizId: string;
  title: string;
  passScore: number;
  questions: PublicQuestion[];
  skillKind?: "vocabulary" | "reading" | "listening" | "speaking";
  skillItemId?: string | null;
};

/**
 * Wraps QuizPlayer and records guest progress when a skill-linked quiz is passed.
 */
export function SkillAwareQuizPlayer({
  quizId,
  title,
  passScore,
  questions,
  skillKind,
  skillItemId,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  if (!mounted) {
    return (
      <QuizPlayer
        quizId={quizId}
        title={title}
        passScore={passScore}
        questions={questions}
      />
    );
  }

  return (
    <QuizPlayerWithProgress
      quizId={quizId}
      title={title}
      passScore={passScore}
      questions={questions}
      skillKind={skillKind}
      skillItemId={skillItemId}
    />
  );
}

function QuizPlayerWithProgress(props: Props) {
  // Patch fetch to capture grade results for guest progress
  useEffect(() => {
    if (!props.skillKind || !props.skillItemId) return;
    const original = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await original(input, init);
      try {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("/api/quiz/grade") && response.ok) {
          const clone = response.clone();
          const data = (await clone.json()) as {
            passed?: boolean;
            percentage?: number;
            timeSpentSec?: number;
          };
          if (data.passed && props.skillItemId && props.skillKind) {
            markLessonComplete(
              props.skillKind,
              props.skillItemId,
              data.percentage,
              data.timeSpentSec,
            );
          }
        }
      } catch {
        // ignore
      }
      return response;
    };
    return () => {
      window.fetch = original;
    };
  }, [props.skillKind, props.skillItemId]);

  return (
    <QuizPlayer
      quizId={props.quizId}
      title={props.title}
      passScore={props.passScore}
      questions={props.questions}
    />
  );
}
