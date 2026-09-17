import { setRequestLocale } from "next-intl/server";
import { ProfileClient } from "@/components/profile/profile-client";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProfileClient />;
}
