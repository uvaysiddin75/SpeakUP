import { setRequestLocale } from "next-intl/server";
import { SkillHubClient } from "@/components/skills/skill-hub-client";
import { listListeningLessons } from "@/services/skills-service";

export default async function ListeningPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let lessons: Awaited<ReturnType<typeof listListeningLessons>> = [];
  try {
    lessons = await listListeningLessons();
  } catch {
    lessons = [];
  }

  const items = lessons.map((lesson) => ({
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description ?? "Listening practice with transcript and quiz.",
    levelCode: lesson.levelCode,
    difficulty: lesson.difficulty,
    lessonsCount: Math.max(1, lesson._count.questions),
    href: `/listening/${lesson.levelCode.toLowerCase()}/${lesson.slug}`,
  }));

  return (
    <SkillHubClient
      title="Listening"
      subtitle="Train your ear with dialogues, talks, and reports — player, transcript, and tests."
      skill="listening"
      items={items}
      accent="#7c3aed"
    />
  );
}
