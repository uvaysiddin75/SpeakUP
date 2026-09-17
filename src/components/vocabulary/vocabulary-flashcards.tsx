"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Heart, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import { markWordLearned } from "@/lib/guest-progress";

export type FlashcardWord = {
  id: string;
  word: string;
  translationRu: string;
  translationUz: string;
  pronunciation?: string | null;
  example?: string | null;
  partOfSpeech?: string | null;
  description?: string | null;
  difficulty?: string | null;
  audioUrl?: string | null;
};

type VocabularyFlashcardsProps = {
  topicId: string;
  words: FlashcardWord[];
  initiallyLearned?: string[];
  onLearnedChange?: (learnedIds: string[]) => void;
};

export function VocabularyFlashcards({
  topicId,
  words,
  initiallyLearned = [],
  onLearnedChange,
}: VocabularyFlashcardsProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [learned, setLearned] = useState<Set<string>>(
    () => new Set(initiallyLearned),
  );

  const current = words[index];
  const progress = words.length
    ? Math.round((learned.size / words.length) * 100)
    : 0;

  const goTo = (nextIndex: number) => {
    setIndex(nextIndex);
    setFlipped(false);
  };

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }, []);

  const toggleLearned = () => {
    if (!current) return;
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(current.id)) next.delete(current.id);
      else {
        next.add(current.id);
        markWordLearned(topicId, current.id);
      }
      onLearnedChange?.([...next]);
      return next;
    });
  };

  const knownLabel = useMemo(() => {
    if (!current) return false;
    return learned.has(current.id);
  }, [current, learned]);

  if (!current) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        No words in this topic yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProgressBar
        value={progress}
        label={`Learned ${learned.size} / ${words.length}`}
        tone="success"
      />

      <div className="perspective-[1200px]">
        <button
          type="button"
          onClick={() => setFlipped((v) => !v)}
          className={cn(
            "relative w-full min-h-[280px] rounded-2xl border border-border bg-card text-left shadow-[var(--shadow)] transition-transform duration-500 [transform-style:preserve-3d] sm:min-h-[320px]",
            flipped && "[transform:rotateY(180deg)]",
          )}
          aria-label={flipped ? "Show word" : "Show translation"}
        >
          <div className="absolute inset-0 flex flex-col p-6 [backface-visibility:hidden]">
            <div className="flex items-start justify-between gap-3">
              <Badge>{current.partOfSpeech ?? "word"}</Badge>
              {current.difficulty ? (
                <Badge variant="primary">{current.difficulty}</Badge>
              ) : null}
            </div>
            <div className="mt-auto space-y-3 pb-6 text-center">
              <p className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
                {current.word}
              </p>
              {current.pronunciation ? (
                <p className="text-sm text-muted-foreground">{current.pronunciation}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">Tap to flip</p>
            </div>
          </div>

          <div className="absolute inset-0 flex flex-col rounded-2xl bg-gradient-to-br from-primary/8 to-secondary/10 p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="mt-4 space-y-3">
              <p className="font-display text-2xl font-semibold">{current.word}</p>
              <p className="text-xl font-semibold text-primary">{current.translationRu}</p>
              <p className="text-sm text-muted-foreground">{current.translationUz}</p>
              {current.pronunciation ? (
                <p className="text-sm text-muted-foreground">{current.pronunciation}</p>
              ) : null}
              {current.example ? (
                <p className="rounded-xl bg-card/80 px-3 py-2 text-sm italic shadow-sm">
                  “{current.example}”
                </p>
              ) : null}
            </div>
          </div>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => goTo(Math.max(0, index - 1))}
          disabled={index === 0}
          aria-label="Previous word"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" onClick={() => speak(current.word)}>
          <Volume2 className="mr-1.5 h-4 w-4" />
          Pronounce
        </Button>
        <Button
          type="button"
          variant={favorites.has(current.id) ? "accent" : "ghost"}
          size="icon"
          aria-label="Favorite"
          onClick={() =>
            setFavorites((prev) => {
              const next = new Set(prev);
              if (next.has(current.id)) next.delete(current.id);
              else next.add(current.id);
              return next;
            })
          }
        >
          <Heart
            className={cn("h-4 w-4", favorites.has(current.id) && "fill-current")}
          />
        </Button>
        <Button
          type="button"
          variant={knownLabel ? "success" : "primary"}
          onClick={toggleLearned}
        >
          <Check className="mr-1.5 h-4 w-4" />
          {knownLabel ? "Learned" : "Mark learned"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => goTo(0)}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" />
          Restart
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="ml-auto"
          onClick={() => goTo(Math.min(words.length - 1, index + 1))}
          disabled={index >= words.length - 1}
          aria-label="Next word"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Word {index + 1} of {words.length}
      </p>
    </div>
  );
}
