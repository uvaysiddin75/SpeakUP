import { setRequestLocale } from "next-intl/server";
import { SkillHubClient } from "@/components/skills/skill-hub-client";
import { listVocabularyTopics } from "@/services/skills-service";

export default async function VocabularyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let topics: Awaited<ReturnType<typeof listVocabularyTopics>> = [];
  try {
    topics = await listVocabularyTopics();
  } catch {
    topics = [];
  }

  const items = topics.map((topic) => ({
    id: topic.id,
    slug: topic.slug,
    title: topic.title,
    description: topic.description,
    levelCode: topic.levelCode,
    difficulty: topic.difficulty,
    lessonsCount: topic._count.words,
    href: `/vocabulary/${topic.levelCode.toLowerCase()}/${topic.slug}`,
  }));

  return (
    <SkillHubClient
      title="Vocabulary"
      subtitle="Learn words by level and topic — flashcards, pronunciation, and tests for A1–C2."
      skill="vocabulary"
      items={items}
      accent="#0f766e"
    />
  );
}
