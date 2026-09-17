import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">{t("tagline")}</p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t("note")}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">{t("product")}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/courses" className="hover:text-foreground">
                {tNav("courses")}
              </Link>
            </li>
            <li>
              <Link href="/tests" className="hover:text-foreground">
                {tNav("tests")}
              </Link>
            </li>
            <li>
              <Link href="/progress" className="hover:text-foreground">
                {tNav("progress")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">{t("learn")}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/grammar" className="hover:text-foreground">
                {tNav("grammar")}
              </Link>
            </li>
            <li>
              <Link href="/vocabulary" className="hover:text-foreground">
                {tNav("vocabulary")}
              </Link>
            </li>
            <li>
              <Link href="/reading" className="hover:text-foreground">
                {tNav("reading")}
              </Link>
            </li>
            <li>
              <Link href="/listening" className="hover:text-foreground">
                {tNav("listening")}
              </Link>
            </li>
            <li>
              <Link href="/writing" className="hover:text-foreground">
                {tNav("writing")}
              </Link>
            </li>
            <li>
              <Link href="/speaking" className="hover:text-foreground">
                {tNav("speaking")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">{t("account")}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/login" className="hover:text-foreground">
                {tNav("login")}
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-foreground">
                {tNav("signUp")}
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-foreground">
                {tNav("dashboard")}
              </Link>
            </li>
            <li>
              <Link href="/settings" className="hover:text-foreground">
                {tNav("settings")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
          {t("rights", { year })}
        </p>
      </div>
    </footer>
  );
}
