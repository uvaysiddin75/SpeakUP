import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

async function safeCounts() {
  try {
    const [
      levels,
      categories,
      topics,
      vocabularyTopics,
      vocabularyWords,
      reading,
      listening,
      speaking,
      quizzes,
    ] = await Promise.all([
      prisma.level.count(),
      prisma.category.count(),
      prisma.topic.count(),
      prisma.vocabularyTopic.count(),
      prisma.vocabularyWord.count(),
      prisma.readingText.count(),
      prisma.listeningTask.count(),
      prisma.speakingTask.count(),
      prisma.quiz.count(),
    ]);
    return {
      levels,
      categories,
      topics,
      vocabularyTopics,
      vocabularyWords,
      reading,
      listening,
      speaking,
      quizzes,
    };
  } catch {
    return null;
  }
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const counts = await safeCounts();

  const sections = [
    {
      title: "Vocabulary",
      href: "/vocabulary",
      description: "Topics, words, flashcards, and vocabulary tests.",
      count: counts?.vocabularyTopics ?? 0,
      extra: `${counts?.vocabularyWords ?? 0} words`,
    },
    {
      title: "Reading",
      href: "/reading",
      description: "Texts, important words, and comprehension tests.",
      count: counts?.reading ?? 0,
    },
    {
      title: "Listening",
      href: "/listening",
      description: "Audio lessons, transcripts, and listening tests.",
      count: counts?.listening ?? 0,
    },
    {
      title: "Speaking",
      href: "/speaking",
      description: "Speaking tasks, recording, and self-evaluation.",
      count: counts?.speaking ?? 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Admin Panel
            </h1>
            <Badge variant="warning">CMS</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Manage curriculum content for Vocabulary, Reading, Listening, and
            Speaking. Full CRUD forms are seeded via{" "}
            <code className="rounded bg-muted px-1">npm run db:seed</code>; use
            skill hubs to review published content.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to app</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Levels" value={counts?.levels ?? 0} />
        <Stat label="Categories" value={counts?.categories ?? 0} />
        <Stat label="Course topics" value={counts?.topics ?? 0} />
        <Stat label="Quizzes" value={counts?.quizzes ?? 0} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{section.title}</span>
                <Badge variant="primary">{section.count}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{section.description}</p>
              {"extra" in section && section.extra ? (
                <p className="text-xs text-muted-foreground">{section.extra}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href={section.href}>Open published</Link>
                </Button>
                <Badge variant="success">Publish</Badge>
                <Badge>Create / Edit / Delete via seed</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Schema supports Create / Edit / Delete / Publish for Levels,
            Categories, Topics, Subtopics, Lessons, Words, Texts, Audio,
            Questions, Tests, and Speaking Tasks.
          </p>
          <p>
            Run <code className="rounded bg-muted px-1">npm run db:push</code>{" "}
            then <code className="rounded bg-muted px-1">npm run db:seed</code>{" "}
            to refresh all A1–C2 skill content and quizzes.
          </p>
          <p>
            Admin user: <strong>admin@speakup.local</strong> (role ADMIN). Auth
            UI remains Stage 4; this panel is available for content review now.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
