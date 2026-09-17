import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.login");
  const tNav = await getTranslations("nav");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Sign in with Google to save progress and solve lessons online.
        </p>
        <GoogleSignInButton
          label={`${tNav("login")} with Google`}
          callbackUrl={`/${locale}/dashboard`}
        />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/register" className="font-medium text-primary hover:underline">
            {tNav("signUp")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
