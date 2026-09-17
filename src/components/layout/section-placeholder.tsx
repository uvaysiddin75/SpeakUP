import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/empty-state";

interface SectionPlaceholderProps {
  pageKey:
    | "courses"
    | "grammar"
    | "vocabulary"
    | "reading"
    | "listening"
    | "writing"
    | "speaking"
    | "tests"
    | "progress"
    | "dashboard"
    | "profile"
    | "settings"
    | "login"
    | "register";
}

export function SectionPlaceholder({ pageKey }: SectionPlaceholderProps) {
  const t = useTranslations("pages");
  const tCommon = useTranslations("common");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {t(`${pageKey}.title`)}
        </h1>
        <p className="mt-2 text-muted-foreground">{t(`${pageKey}.subtitle`)}</p>
      </div>
      <EmptyState
        title={tCommon("empty")}
        description={`${tCommon("comingSoon")} ${tCommon("foundationNote")}`}
      />
    </div>
  );
}
