"use client";

import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSwitcher({ className, compact }: LanguageSwitcherProps) {
  const t = useTranslations("language");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className={cn("inline-flex items-center gap-2", className)}>
      {!compact ? (
        <span className="sr-only sm:not-sr-only sm:inline-flex sm:items-center sm:gap-1.5 sm:text-sm sm:text-muted-foreground">
          <Languages className="h-4 w-4" aria-hidden />
          {t("label")}
        </span>
      ) : (
        <Languages className="h-4 w-4 text-muted-foreground" aria-hidden />
      )}
      <select
        aria-label={t("label")}
        className="h-10 rounded-xl border border-border bg-card px-2.5 text-sm font-medium"
        value={locale}
        onChange={(event) => {
          router.replace(pathname, { locale: event.target.value as Locale });
        }}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {t(code)}
          </option>
        ))}
      </select>
    </label>
  );
}
