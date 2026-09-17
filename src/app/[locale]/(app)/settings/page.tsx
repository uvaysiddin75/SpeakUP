import { getTranslations, setRequestLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.settings");
  const tTheme = await getTranslations("theme");
  const tLang = await getTranslations("language");
  const tCommon = await getTranslations("common");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tLang("label")}</CardTitle>
            <CardDescription>{tCommon("foundationNote")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageSwitcher />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tTheme("label")}</CardTitle>
            <CardDescription>Light · Dark · System</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSwitcher variant="select" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
