"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themes = [
  { id: "light", icon: Sun },
  { id: "dark", icon: Moon },
  { id: "system", icon: Monitor },
] as const;

function useMounted() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

interface ThemeSwitcherProps {
  className?: string;
  variant?: "buttons" | "select";
}

export function ThemeSwitcher({
  className,
  variant = "buttons",
}: ThemeSwitcherProps) {
  const t = useTranslations("theme");
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <div className={cn("h-10 w-[120px]", className)} aria-hidden />;
  }

  if (variant === "select") {
    return (
      <label className={cn("inline-flex items-center gap-2", className)}>
        <span className="text-sm text-muted-foreground">{t("label")}</span>
        <select
          aria-label={t("label")}
          className="h-10 rounded-xl border border-border bg-card px-2.5 text-sm font-medium"
          value={theme}
          onChange={(event) => setTheme(event.target.value)}
        >
          <option value="light">{t("light")}</option>
          <option value="dark">{t("dark")}</option>
          <option value="system">{t("system")}</option>
        </select>
      </label>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl border border-border bg-card p-1",
        className,
      )}
      role="group"
      aria-label={t("label")}
    >
      {themes.map(({ id, icon: Icon }) => (
        <Button
          key={id}
          type="button"
          size="icon"
          variant={theme === id ? "secondary" : "ghost"}
          className="h-8 w-8"
          aria-label={t(id)}
          aria-pressed={theme === id}
          onClick={() => setTheme(id)}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
