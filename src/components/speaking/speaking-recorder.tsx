"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Play, RotateCcw, Trash2, Check } from "lucide-react";
import { useUxOptional } from "@/components/providers/ux-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SpeakingRecorderProps = {
  maxSeconds?: number;
  onRecordingReady?: (blob: Blob | null, durationSec: number) => void;
  className?: string;
};

export function SpeakingRecorder({
  maxSeconds = 180,
  onRecordingReady,
  className,
}: SpeakingRecorderProps) {
  const ux = useUxOptional();
  const [supported, setSupported] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [justFinished, setJustFinished] = useState(false);
  const [levels, setLevels] = useState<number[]>(() => Array(24).fill(4));

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const durationRef = useRef(0);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
  };

  useEffect(() => {
    const ok =
      typeof MediaRecorder !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia;
    queueMicrotask(() => setSupported(ok));
    return () => {
      stopTracks();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  const startWaveform = (stream: MediaStream) => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    analyserRef.current = analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const sample = Array.from({ length: 24 }, (_, i) => {
        const v = data[i % data.length] ?? 0;
        return Math.max(4, Math.round((v / 255) * 28));
      });
      setLevels(sample);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const startRecording = async () => {
    setPermissionError(null);
    setJustFinished(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunks.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingReady?.(blob, durationRef.current);
        setJustFinished(true);
        ux?.play("recording-stop");
        ux?.toast({
          title: "Recording Complete ✓",
          description: formatTime(durationRef.current),
          tone: "success",
          icon: "success",
          durationMs: 2200,
        });
        stopTracks();
      };
      recorder.start();
      setRecording(true);
      setDuration(0);
      ux?.play("recording-start");
      startWaveform(stream);
      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d + 1 >= maxSeconds) {
            stopRecording();
            return d + 1;
          }
          return d + 1;
        });
      }, 1000);
    } catch {
      setPermissionError(
        "Microphone access is blocked or unavailable. Allow microphone permission in your browser settings, or use another device.",
      );
      setSupported(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.stop();
    }
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const clearRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
    setJustFinished(false);
    setLevels(Array(24).fill(4));
    onRecordingReady?.(null, 0);
  };

  if (!supported || permissionError) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-danger/30 bg-danger/10 p-5 text-sm text-danger animate-shake",
          className,
        )}
      >
        <p className="font-semibold">Microphone unavailable</p>
        <p className="mt-1 opacity-90">
          {permissionError ??
            "This browser does not support MediaRecorder / getUserMedia."}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow)]",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-center gap-2">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full text-lg",
            recording
              ? "bg-danger/15 text-danger animate-recording"
              : "bg-primary/10 text-primary",
          )}
          aria-hidden
        >
          🎤
        </span>
        <div className="text-center">
          <p className="text-sm font-semibold">
            {recording
              ? "Recording"
              : justFinished
                ? "Recording Complete ✓"
                : "Ready to record"}
          </p>
          <p className="font-display text-2xl font-semibold tabular-nums">
            {formatTime(duration)}
          </p>
        </div>
      </div>

      <div className="flex h-12 items-end justify-center gap-1" aria-hidden>
        {levels.map((h, i) => (
          <span
            key={i}
            className={cn(
              "w-1.5 rounded-full bg-primary/70 transition-all",
              recording ? "opacity-100" : "opacity-40",
            )}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {!recording ? (
          <Button type="button" onClick={startRecording}>
            <Mic className="mr-1.5 h-4 w-4" />
            Start Recording
          </Button>
        ) : (
          <Button
            type="button"
            variant="danger"
            className="animate-recording"
            onClick={stopRecording}
          >
            <Square className="mr-1.5 h-4 w-4" />
            Stop Recording
          </Button>
        )}
        {audioUrl ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const audio = new Audio(audioUrl);
                void audio.play();
              }}
            >
              <Play className="mr-1.5 h-4 w-4" />
              Play Recording
            </Button>
            <Button type="button" variant="secondary" onClick={clearRecording}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Record Again
            </Button>
            <Button type="button" variant="ghost" onClick={clearRecording}>
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          </>
        ) : null}
      </div>

      {justFinished ? (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm font-medium text-success animate-fade-up">
          <Check className="h-4 w-4" />
          Recording saved — you can play it back or continue.
        </p>
      ) : null}
    </div>
  );
}

function formatTime(totalSec: number) {
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
