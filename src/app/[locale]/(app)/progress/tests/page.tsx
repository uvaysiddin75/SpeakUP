import { auth } from "@/auth";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTestHistory } from "@/services/progress-service";

export default async function ProgressTestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const userId = session?.user?.id;
  const tests = userId ? await getTestHistory(userId).catch(() => []) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Test history
          </h1>
          <p className="mt-1 text-muted-foreground">
            Real attempts saved in the database. Best scores never decrease.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/progress">Back to progress</Link>
        </Button>
      </div>

      {!userId ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-muted-foreground">Sign in to see your test history.</p>
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      ) : tests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No tests completed yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-semibold">{test.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {test.correctAnswers}/{test.totalQuestions} correct ·{" "}
                    {test.wrongAnswers} wrong · {test.attempts} attempt(s)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(test.completedAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant={test.passed ? "success" : "danger"}>
                  {test.score}% · {test.passed ? "Passed" : "Failed"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
