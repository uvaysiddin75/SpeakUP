"use client";

import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { useUx } from "@/components/providers/ux-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VOLUME_STEPS = [0, 0.25, 0.5, 0.75, 1] as const;

export function SoundSettingsPanel() {
  const { soundSettings, updateSoundSettings, play, toast } = useUx();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 rounded-xl bg-muted" />
        <div className="h-10 rounded-xl bg-muted" />
        <div className="h-20 rounded-xl bg-muted" />
      </div>
    );
  }

  const saveToast = () => {
    toast({
      title: "Settings saved ✓",
      description: "Sound preferences updated",
      tone: "success",
      icon: "success",
      durationMs: 2000,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Sound Effects</p>
          <p className="text-sm text-muted-foreground">Master switch for UI sounds</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={soundSettings.enabled}
          onClick={() => {
            updateSoundSettings({ enabled: !soundSettings.enabled });
            saveToast();
          }}
          className={cn(
            "relative h-8 w-14 rounded-full transition-colors duration-200",
            soundSettings.enabled ? "bg-primary" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200",
              soundSettings.enabled && "translate-x-6",
            )}
          />
        </button>
      </div>

      <div className={cn(!soundSettings.enabled && "pointer-events-none opacity-50")}>
        <p className="mb-2 text-sm font-medium">Volume</p>
        <div className="flex flex-wrap gap-2">
          {VOLUME_STEPS.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => {
                updateSoundSettings({ volume: step });
                saveToast();
              }}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]",
                Math.abs(soundSettings.volume - step) < 0.01
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {Math.round(step * 100)}%
            </button>
          ))}
        </div>
      </div>

      <div className={cn("space-y-3", !soundSettings.enabled && "pointer-events-none opacity-50")}>
        <ToggleRow
          label="🔊 Correct Answer Sounds"
          checked={soundSettings.correctAnswer}
          onChange={(checked) => {
            updateSoundSettings({ correctAnswer: checked });
            saveToast();
          }}
        />
        <ToggleRow
          label="🔊 Achievement Sounds"
          checked={soundSettings.achievement}
          onChange={(checked) => {
            updateSoundSettings({ achievement: checked });
            saveToast();
          }}
        />
        <ToggleRow
          label="🔊 Speaking Sounds"
          checked={soundSettings.speaking}
          onChange={(checked) => {
            updateSoundSettings({ speaking: checked });
            saveToast();
          }}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!soundSettings.enabled}
        onClick={() => play("achievement")}
      >
        <Volume2 className="mr-1.5 h-4 w-4" />
        Test sound
      </Button>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 rounded-full transition-colors duration-200",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}
