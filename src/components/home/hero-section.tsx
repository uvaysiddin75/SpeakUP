import { useTranslations } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="relative overflow-hidden">
      <div className="speakup-grid absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14 lg:px-8 lg:py-24">
        <div className="animate-fade-up max-w-xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            SpeakUp · A1–C2
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="accent">
              <Link href="/courses">
                {t("startLearning")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/courses">{t("exploreCourses")}</Link>
            </Button>
          </div>
        </div>

        <div className="animate-float-soft relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="speakup-hero-panel relative overflow-hidden rounded-[1.75rem] p-6 text-white shadow-[var(--shadow)] sm:p-8">
            <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-orange-400/30 blur-2xl" aria-hidden />
            <div className="absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-violet-200/20 blur-2xl" aria-hidden />
            <p className="text-sm font-medium text-indigo-100">Your learning path</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">From A1 to fluent speech</h2>
            <ul className="mt-6 space-y-3">
              {[
                { label: "Grammar & Vocabulary", value: "Structured lessons" },
                { label: "Reading & Listening", value: "Real comprehension" },
                { label: "Writing & Speaking", value: "Active practice" },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 backdrop-blur"
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-indigo-100">{item.value}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span>Overall progress</span>
                <span>0%</span>
              </div>
              <div className="h-2 rounded-full bg-white/20">
                <div className="h-full w-[8%] rounded-full bg-orange-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
