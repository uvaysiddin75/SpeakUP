import { setRequestLocale } from "next-intl/server";
import { SkillHubClient } from "@/components/skills/skill-hub-client";
import { listSpeakingLessons } from "@/services/skills-service";

export default async function SpeakingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let lessons: Awaited<ReturnType<typeof listSpeakingLessons>> = [];
  try {
    lessons = await listSpeakingLessons();
  } catch {
    lessons = [];
  }

  const items = lessons.map((lesson) => ({
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.prompt,
    levelCode: lesson.levelCode,
    difficulty: lesson.difficulty,
    lessonsCount: 1,
    href: `/speaking/${lesson.levelCode.toLowerCase()}/${lesson.slug}`,
  }));

  return (
    <SkillHubClient
      title="Speaking"
      subtitle="Practice speaking with guided tasks, useful phrases, recording, and self-evaluation."
      skill="speaking"
      items={items}
      accent="#ea580c"
    />
  );
}
