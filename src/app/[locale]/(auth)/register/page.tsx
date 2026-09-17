import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.register");
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input label="Username" name="username" autoComplete="username" disabled />
        <Input label="Email" type="email" name="email" autoComplete="email" disabled />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          disabled
        />
        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          disabled
        />
        <p className="text-xs text-muted-foreground">{tCommon("comingSoon")}</p>
        <Button className="w-full" disabled>
          {tNav("signUp")}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            {tNav("login")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
