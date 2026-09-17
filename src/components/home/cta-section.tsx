import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  const t = useTranslations("home");

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="speakup-hero-panel overflow-hidden rounded-[1.75rem] px-6 py-12 text-center text-white sm:px-10">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t("ctaTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-teal-50/90">{t("ctaSubtitle")}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="accent">
            <Link href="/register">{t("startLearning")}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            <Link href="/courses">{t("exploreCourses")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
