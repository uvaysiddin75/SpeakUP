import { setRequestLocale } from "next-intl/server";
import { SectionPlaceholder } from "@/components/layout/section-placeholder";

export default async function WritingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SectionPlaceholder pageKey="writing" />;
}
