import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function TestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const links = [
    {
      title: "Vocabulary tests",
      href: "/vocabulary",
      text: "Open a topic and take its 20-question test (pass mark 70%).",
    },
    {
      title: "Reading tests",
      href: "/reading",
      text: "Read the text, then start the comprehension test.",
    },
    {
      title: "Listening tests",
      href: "/listening",
      text: "Listen first, optionally show transcript, then take the quiz.",
    },
    {
      title: "Course tests",
      href: "/courses",
      text: "Subtopic, topic, category and level finals inside Courses.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Tests</h1>
        <p className="mt-1 text-muted-foreground">
          Unified quiz system with shuffled questions and options. Passing score: 70%.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((item) => (
          <Card key={item.href}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{item.text}</p>
              <Button asChild>
                <Link href={item.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
