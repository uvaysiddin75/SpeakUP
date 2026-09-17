"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpeakingRecorder } from "@/components/speaking/speaking-recorder";
import { SpeakingSelfEval } from "@/components/speaking/speaking-self-eval";

type Props = {
  taskId: string;
  prompt: string;
  instructions: string | null;
  usefulVocabulary: string[];
  usefulPhrases: string[];
  exampleAnswer: string | null;
  timerSec: number;
  tips: string | null;
};

export function SpeakingPracticeClient({
  taskId,
  prompt,
  instructions,
  usefulVocabulary,
  usefulPhrases,
  exampleAnswer,
  timerSec,
  tips,
}: Props) {
  const [remaining, setRemaining] = useState(timerSec);
  const [timerOn, setTimerOn] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);

  useEffect(() => {
    if (!timerOn) return;
    if (remaining <= 0) {
      queueMicrotask(() => setTimerOn(false));
      return;
    }
    const id = setInterval(() => setRemaining((v) => v - 1), 1000);
    return () => clearInterval(id);
  }, [timerOn, remaining]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Speaking task</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p className="text-base font-medium">{prompt}</p>
          {instructions ? <p className="text-muted-foreground">{instructions}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
              onClick={() => {
                setRemaining(timerSec);
                setTimerOn(true);
              }}
            >
              Start timer ({timerSec}s)
            </button>
            <span className="font-display text-lg font-semibold tabular-nums">
              {Math.floor(remaining / 60)
                .toString()
                .padStart(2, "0")}
              :{(remaining % 60).toString().padStart(2, "0")}
            </span>
          </div>
          {tips ? <p className="text-xs text-muted-foreground">{tips}</p> : null}
        </CardContent>
      </Card>

      {usefulVocabulary.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Useful vocabulary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {usefulVocabulary.map((word) => (
              <span
                key={word}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
              >
                {word}
              </span>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {usefulPhrases.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Useful phrases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {usefulPhrases.map((phrase) => (
              <p key={phrase} className="rounded-xl bg-muted/60 px-3 py-2 text-sm">
                {phrase}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {exampleAnswer ? (
        <Card>
          <CardHeader>
            <CardTitle>Example answer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed italic">
              {exampleAnswer}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <SpeakingRecorder
        maxSeconds={Math.max(timerSec, 60)}
        onRecordingReady={(blob) => setHasRecording(Boolean(blob))}
      />

      {hasRecording ? <SpeakingSelfEval taskId={taskId} /> : null}
    </div>
  );
}
