"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SOUND_SETTINGS,
  readSoundSettings,
  writeSoundSettings,
  type SoundSettings,
} from "@/lib/sound-settings";
import { playSfx, type SfxName } from "@/lib/sfx";
import { ToastViewport, type ToastItem, type ToastTone } from "@/components/ui/toast";

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
  icon?: "success" | "error" | "achievement" | "streak" | "info";
};

type UxContextValue = {
  soundSettings: SoundSettings;
  updateSoundSettings: (patch: Partial<SoundSettings>) => void;
  play: (name: SfxName) => void;
  toast: (input: ToastInput) => void;
  celebrate: (opts?: { intensity?: "soft" | "strong" }) => void;
};

const UxContext = createContext<UxContextValue | null>(null);

let toastId = 0;

export function UxProvider({ children }: { children: ReactNode }) {
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(
    DEFAULT_SOUND_SETTINGS,
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiIntensity, setConfettiIntensity] = useState<"soft" | "strong">(
    "soft",
  );

  useEffect(() => {
    setSoundSettings(readSoundSettings());
  }, []);

  const updateSoundSettings = useCallback((patch: Partial<SoundSettings>) => {
    setSoundSettings((prev) => {
      const next = { ...prev, ...patch };
      if (typeof next.volume === "number") {
        next.volume = Math.max(0, Math.min(1, next.volume));
      }
      writeSoundSettings(next);
      return next;
    });
  }, []);

  const play = useCallback(
    (name: SfxName) => {
      playSfx(name, soundSettings);
    },
    [soundSettings],
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = ++toastId;
    const item: ToastItem = {
      id,
      title: input.title,
      description: input.description,
      tone: input.tone ?? "info",
      icon: input.icon ?? "info",
      durationMs: input.durationMs ?? 3200,
    };
    setToasts((prev) => [...prev.slice(-3), item]);
  }, []);

  const celebrate = useCallback((opts?: { intensity?: "soft" | "strong" }) => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    setConfettiIntensity(opts?.intensity ?? "soft");
    setConfettiKey((k) => k + 1);
  }, []);

  const value = useMemo(
    () => ({
      soundSettings,
      updateSoundSettings,
      play,
      toast,
      celebrate,
    }),
    [soundSettings, updateSoundSettings, play, toast, celebrate],
  );

  return (
    <UxContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
      {confettiKey > 0 ? (
        <ConfettiBurst key={confettiKey} intensity={confettiIntensity} />
      ) : null}
    </UxContext.Provider>
  );
}

export function useUx() {
  const ctx = useContext(UxContext);
  if (!ctx) {
    throw new Error("useUx must be used within UxProvider");
  }
  return ctx;
}

export function useUxOptional() {
  return useContext(UxContext);
}

function ConfettiBurst({ intensity }: { intensity: "soft" | "strong" }) {
  const count = intensity === "strong" ? 36 : 22;
  const pieces = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden>
      {pieces.map((i) => {
        const left = 8 + ((i * 37) % 84);
        const delay = (i % 8) * 40;
        const duration = 1200 + (i % 5) * 180;
        const size = 6 + (i % 4);
        const colors = [
          "var(--primary)",
          "var(--accent)",
          "var(--secondary)",
          "var(--success)",
          "#fbbf24",
        ];
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            className="confetti-piece absolute top-[-12px] rounded-sm"
            style={{
              left: `${left}%`,
              width: size,
              height: size * (0.6 + (i % 3) * 0.3),
              background: color,
              animationDelay: `${delay}ms`,
              animationDuration: `${duration}ms`,
              transform: `rotate(${i * 24}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}
