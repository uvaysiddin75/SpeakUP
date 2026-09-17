import { setRequestLocale } from "next-intl/server";
import { SkillHubClient } from "@/components/skills/skill-hub-client";
import { listReadingLessons } from "@/services/skills-service";

export default async function ReadingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let lessons: Awaited<ReturnType<typeof listReadingLessons>> = [];
  try {
    lessons = await listReadingLessons();
  } catch {
    lessons = [];
  }

  const items = lessons.map((lesson) => ({
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description ?? "Reading comprehension practice.",
    levelCode: lesson.levelCode,
    difficulty: lesson.difficulty,
    lessonsCount: Math.max(1, lesson._count.questions),
    href: `/reading/${lesson.levelCode.toLowerCase()}/${lesson.slug}`,
  }));

  return (
    <SkillHubClient
      title="Reading"
      subtitle="Levelled texts with vocabulary support and comprehension tests from A1 to C2."
      skill="reading"
      items={items}
      accent="#0369a1"
    />
  );
}
