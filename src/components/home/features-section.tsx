"use client";

import {
  BookMarked,
  BookOpenCheck,
  Headphones,
  Mic,
  PenLine,
  SpellCheck2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const featureMeta = [
  { key: "grammar", href: "/grammar", icon: SpellCheck2 },
  { key: "vocabulary", href: "/vocabulary", icon: BookOpenCheck },
  { key: "reading", href: "/reading", icon: BookMarked },
  { key: "listening", href: "/listening", icon: Headphones },
  { key: "writing", href: "/writing", icon: PenLine },
  { key: "speaking", href: "/speaking", icon: Mic },
] as const;

export function FeaturesSection() {
  const t = useTranslations("home");

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t("whyTitle")}
        </h2>
        <p className="mt-3 text-muted-foreground">{t("whySubtitle")}</p>
      </Reveal>

      <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stepMs={70}>
        {featureMeta.map(({ key, href, icon: Icon }) => (
          <Link key={key} href={href} className="group block h-full">
            <Card className="h-full transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[var(--shadow-hover)]">
              <CardHeader>
                <div className="mb-2 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <CardTitle>{t(`features.${key}.title`)}</CardTitle>
                <CardDescription>{t(`features.${key}.description`)}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </Stagger>
    </section>
  );
}
