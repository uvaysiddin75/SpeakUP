import { setRequestLocale } from "next-intl/server";
import { ProgressClient } from "@/components/progress/progress-client";
import { getSkillDashboardCounts } from "@/services/skills-service";

export default async function ProgressPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let totals = { vocabulary: 0, reading: 0, listening: 0, speaking: 0 };
  try {
    totals = await getSkillDashboardCounts();
  } catch {
    // ignore
  }

  return <ProgressClient totals={totals} />;
}
