"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

type AudioPlayerProps = {
  /** Remote audio URL if available */
  audioUrl?: string | null;
  /** Used with Web Speech API when no audioUrl */
  transcript?: string | null;
  title?: string;
  className?: string;
};

/**
 * Modern listening player.
 * Prefers real audioUrl; falls back to speechSynthesis for transcript-only lessons.
 */
export function AudioPlayer({
  audioUrl,
  transcript,
  title,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [mode, setMode] = useState<"audio" | "speech">(
    audioUrl ? "audio" : "speech",
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    if (speechTimer.current) clearInterval(speechTimer.current);
    utteranceRef.current = null;
    setPlaying(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setMode(audioUrl ? "audio" : "speech");
      stopSpeech();
      setProgress(0);
      setPlaying(false);
    });
  }, [audioUrl, transcript, stopSpeech]);

  useEffect(() => {
    return () => stopSpeech();
  }, [stopSpeech]);

  const speak = useCallback(() => {
    if (!transcript || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(transcript);
    utter.rate = speed;
    utter.volume = muted ? 0 : volume;
    utter.lang = "en-US";
    const estimated = Math.max(8, transcript.split(/\s+/).length / (2.2 * speed));
    setDuration(estimated);
    setProgress(0);
    const started = Date.now();
    speechTimer.current = setInterval(() => {
      const elapsed = (Date.now() - started) / 1000;
      setProgress(Math.min(100, (elapsed / estimated) * 100));
      if (elapsed >= estimated) {
        if (speechTimer.current) clearInterval(speechTimer.current);
      }
    }, 200);
    utter.onend = () => {
      setPlaying(false);
      setProgress(100);
      if (speechTimer.current) clearInterval(speechTimer.current);
    };
    utter.onerror = () => {
      setPlaying(false);
      if (speechTimer.current) clearInterval(speechTimer.current);
    };
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setPlaying(true);
  }, [transcript, speed, muted, volume]);

  const togglePlay = () => {
    if (mode === "audio" && audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        void audioRef.current.play();
        setPlaying(true);
      }
      return;
    }
    if (playing) {
      stopSpeech();
    } else {
      speak();
    }
  };

  const replay = () => {
    if (mode === "audio" && audioRef.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
      setPlaying(true);
      return;
    }
    stopSpeech();
    speak();
  };

  const seek = (value: number) => {
    if (mode === "audio" && audioRef.current && duration > 0) {
      audioRef.current.currentTime = (value / 100) * duration;
      setProgress(value);
    }
  };

  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-4 shadow-[var(--shadow)] sm:p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-2xl" aria-hidden>
          🎧
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Listening player</p>
          <p className="font-display text-lg font-semibold">{title ?? "Audio lesson"}</p>
        </div>
      </div>

      {/* Animated waveform */}
      <div className="mb-4 flex h-10 items-end justify-center gap-1" aria-hidden>
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "wave-bar w-1 rounded-full bg-primary/70",
              playing && "wave-bar-playing",
            )}
            style={{
              height: `${8 + (i % 5) * 4}px`,
              animationDelay: `${(i % 7) * 70}ms`,
              opacity: playing ? 1 : 0.35,
            }}
          />
        ))}
      </div>

      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onTimeUpdate={() => {
            const el = audioRef.current;
            if (!el || !el.duration) return;
            setProgress((el.currentTime / el.duration) * 100);
          }}
          onLoadedMetadata={() => {
            setDuration(audioRef.current?.duration ?? 0);
          }}
          onEnded={() => {
            setPlaying(false);
            setProgress(100);
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="icon"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={replay}
          aria-label="Replay"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <div className="min-w-[140px] flex-1">
          <input
            type="range"
            min={0}
            max={100}
            value={Number.isFinite(progress) ? progress : 0}
            onChange={(e) => seek(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-[var(--primary)]"
            aria-label="Progress"
            disabled={mode === "speech"}
          />
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>{formatClock((progress / 100) * (duration || 0))}</span>
            <span>{formatClock(duration || 0)}</span>
          </div>
        </div>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            if (audioRef.current) audioRef.current.muted = next;
          }}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted || volume === 0 ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => {
            const v = Number(e.target.value);
            setVolume(v);
            setMuted(v === 0);
            if (audioRef.current) audioRef.current.volume = v;
          }}
          className="w-20 accent-[var(--primary)]"
          aria-label="Volume"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Speed</span>
        {SPEEDS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setSpeed(value);
              if (audioRef.current) audioRef.current.playbackRate = value;
              if (playing && mode === "speech") {
                stopSpeech();
                // restart at new speed on next play
              }
            }}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
              speed === value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {value}x
          </button>
        ))}
        {transcript ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => setShowTranscript((v) => !v)}
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            {showTranscript ? "Hide Transcript" : "Show Transcript"}
          </Button>
        ) : null}
      </div>

      {!audioUrl && transcript ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Audio is generated with your browser voice (Speech Synthesis).
        </p>
      ) : null}

      {showTranscript && transcript ? (
        <div className="mt-4 rounded-xl bg-muted/60 p-4 text-sm leading-relaxed">
          {transcript}
        </div>
      ) : null}
    </div>
  );
}

function formatClock(sec: number) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const r = (s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
}
