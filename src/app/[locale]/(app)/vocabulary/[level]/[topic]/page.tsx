import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VocabularyFlashcards } from "@/components/vocabulary/vocabulary-flashcards";
import { getVocabularyTopic } from "@/services/skills-service";

export default async function VocabularyTopicPage({
  params,
}: {
  params: Promise<{ locale: string; level: string; topic: string }>;
}) {
  const { locale, level, topic: topicSlug } = await params;
  setRequestLocale(locale);

  let topic: Awaited<ReturnType<typeof getVocabularyTopic>> = null;
  try {
    topic = await getVocabularyTopic(level, topicSlug);
  } catch {
    topic = null;
  }
  if (!topic) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">{topic.levelCode}</Badge>
          <Badge>{topic.difficulty}</Badge>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {topic.title}
        </h1>
        <p className="max-w-2xl text-muted-foreground">{topic.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Word cards</CardTitle>
        </CardHeader>
        <CardContent>
          <VocabularyFlashcards topicId={topic.id} words={topic.words} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {topic.quiz?.id ? (
          <Button asChild>
            <Link href={`/quiz/${topic.quiz.id}`}>Take vocabulary test</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/vocabulary">All topics</Link>
        </Button>
      </div>
    </div>
  );
}
