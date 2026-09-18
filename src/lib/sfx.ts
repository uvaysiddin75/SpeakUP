/**
 * Lightweight SFX via Web Audio API.
 * Falls back to /public/sounds/*.mp3 when files are present.
 * Never blocks UI; respects sound settings and reduced motion is separate.
 */

import {
  readSoundSettings,
  type SoundSettings,
} from "@/lib/sound-settings";

export type SfxName =
  | "correct"
  | "wrong"
  | "achievement"
  | "level-complete"
  | "recording-start"
  | "recording-stop";

type SfxCategory = "correctAnswer" | "achievement" | "speaking";

const CATEGORY: Record<SfxName, SfxCategory> = {
  correct: "correctAnswer",
  wrong: "correctAnswer",
  achievement: "achievement",
  "level-complete": "achievement",
  "recording-start": "speaking",
  "recording-stop": "speaking",
};

const FILE_MAP: Record<SfxName, string> = {
  correct: "/sounds/correct.mp3",
  wrong: "/sounds/wrong.mp3",
  achievement: "/sounds/achievement.mp3",
  "level-complete": "/sounds/level-complete.mp3",
  "recording-start": "/sounds/recording-start.mp3",
  "recording-stop": "/sounds/recording-stop.mp3",
};

let audioCtx: AudioContext | null = null;
const fileAvailable = new Map<string, boolean>();

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

function allowed(name: SfxName, settings: SoundSettings) {
  if (!settings.enabled || settings.volume <= 0) return false;
  return settings[CATEGORY[name]];
}

async function tryPlayFile(name: SfxName, volume: number) {
  const src = FILE_MAP[name];
  if (fileAvailable.get(src) === false) return false;
  try {
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, volume));
    await audio.play();
    fileAvailable.set(src, true);
    return true;
  } catch {
    fileAvailable.set(src, false);
    return false;
  }
}

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType,
  gainPeak: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function synthesize(name: SfxName, volume: number) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const v = volume * 0.22;

  switch (name) {
    case "correct":
      tone(ctx, 523.25, now, 0.12, "sine", v);
      tone(ctx, 659.25, now + 0.08, 0.14, "sine", v * 0.9);
      tone(ctx, 783.99, now + 0.16, 0.18, "triangle", v * 0.7);
      break;
    case "wrong":
      tone(ctx, 220, now, 0.14, "triangle", v * 0.55);
      tone(ctx, 185, now + 0.1, 0.16, "sine", v * 0.4);
      break;
    case "achievement":
      tone(ctx, 523.25, now, 0.1, "triangle", v);
      tone(ctx, 659.25, now + 0.09, 0.1, "triangle", v);
      tone(ctx, 783.99, now + 0.18, 0.12, "sine", v);
      tone(ctx, 1046.5, now + 0.28, 0.22, "sine", v * 0.85);
      break;
    case "level-complete":
      tone(ctx, 392, now, 0.12, "triangle", v);
      tone(ctx, 523.25, now + 0.1, 0.12, "triangle", v);
      tone(ctx, 659.25, now + 0.2, 0.14, "sine", v);
      tone(ctx, 784, now + 0.32, 0.28, "sine", v * 0.9);
      break;
    case "recording-start":
      tone(ctx, 660, now, 0.08, "sine", v * 0.6);
      break;
    case "recording-stop":
      tone(ctx, 440, now, 0.1, "sine", v * 0.5);
      tone(ctx, 330, now + 0.07, 0.1, "triangle", v * 0.4);
      break;
  }
}

/** Play a named UI sound effect. Safe to call from event handlers. */
export function playSfx(
  name: SfxName,
  settingsOverride?: SoundSettings,
): void {
  const settings = settingsOverride ?? readSoundSettings();
  if (!allowed(name, settings)) return;

  void (async () => {
    const played = await tryPlayFile(name, settings.volume);
    if (!played) synthesize(name, settings.volume);
  })();
}
