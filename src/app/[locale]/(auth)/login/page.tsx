import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.login");
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input label="Email" type="email" name="email" autoComplete="email" disabled />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          disabled
        />
        <p className="text-xs text-muted-foreground">{tCommon("comingSoon")}</p>
        <Button className="w-full" disabled>
          {tNav("login")}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/register" className="font-medium text-primary hover:underline">
            {tNav("signUp")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
