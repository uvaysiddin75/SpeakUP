/**
 * Sound / UX preferences — persisted in localStorage.
 * Optional mp3 files can live in /public/sounds/ later.
 */

export const SOUND_SETTINGS_KEY = "speakup_sound_settings_v1";

export type SoundSettings = {
  enabled: boolean;
  volume: number; // 0–1
  correctAnswer: boolean;
  achievement: boolean;
  speaking: boolean;
};

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 0.55,
  correctAnswer: true,
  achievement: true,
  speaking: true,
};

export function readSoundSettings(): SoundSettings {
  if (typeof window === "undefined") return DEFAULT_SOUND_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SOUND_SETTINGS_KEY);
    if (!raw) return DEFAULT_SOUND_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SoundSettings>;
    return {
      ...DEFAULT_SOUND_SETTINGS,
      ...parsed,
      volume: clampVolume(parsed.volume ?? DEFAULT_SOUND_SETTINGS.volume),
    };
  } catch {
    return DEFAULT_SOUND_SETTINGS;
  }
}

export function writeSoundSettings(settings: SoundSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(settings));
}

function clampVolume(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_SOUND_SETTINGS.volume;
  return Math.max(0, Math.min(1, value));
}
