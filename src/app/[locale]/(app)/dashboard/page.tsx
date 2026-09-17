import { setRequestLocale } from "next-intl/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getSkillDashboardCounts } from "@/services/skills-service";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let counts = { vocabulary: 0, reading: 0, listening: 0, speaking: 0 };
  try {
    counts = await getSkillDashboardCounts();
  } catch {
    // DB may be offline during static analysis
  }

  return <DashboardClient counts={counts} />;
}
