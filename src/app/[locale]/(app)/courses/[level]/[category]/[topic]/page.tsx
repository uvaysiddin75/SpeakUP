import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Lock,
  PlayCircle,
} from "lucide-react";
import { auth } from "@/auth";
import { CourseBreadcrumbs } from "@/components/courses/course-breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getQuizHref } from "@/lib/curriculum";
import {
  buildCourseBreadcrumbs,
  getTopicFromLevel,
} from "@/services/curriculum-service";
import type { ProgressStatus } from "@/types";
import { cn } from "@/lib/utils";

const statusIcons: Record<
  ProgressStatus,
  { icon: typeof Lock; className: string; label: string }
> = {
  LOCKED: { icon: Lock, className: "text-muted-foreground/60", label: "Locked" },
  AVAILABLE: { icon: Circle, className: "text-primary", label: "Available" },
  IN_PROGRESS: {
    icon: PlayCircle,
    className: "text-accent",
    label: "In progress",
  },
  COMPLETED: {
    icon: CheckCircle2,
    className: "text-success",
    label: "Completed",
  },
  MASTERED: {
    icon: CheckCircle2,
    className: "text-warning",
    label: "Mastered",
  },
};

export default async function CourseTopicPage({
  params,
}: {
  params: Promise<{
    locale: string;
    level: string;
    category: string;
    topic: string;
  }>;
}) {
  const {
    locale,
    level: levelSlug,
    category: categorySlug,
    topic: topicSlug,
  } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const result = await getTopicFromLevel(
    levelSlug,
    categorySlug,
    topicSlug,
    session?.user?.id,
  );
  if (!result) notFound();

  const { level, category, topic } = result;
  const tHome = await getTranslations("home");
  const tCourses = await getTranslations("courses");

  const breadcrumbs = buildCourseBreadcrumbs({
    levelCode: level.code,
    levelSlug: level.slug,
    levelName: tHome(`levels.${level.code}.name`),
    categoryName: category.name,
    categorySlug: category.slug,
    topicTitle: topic.title,
    topicSlug: topic.slug,
  });

  const testFallback = `/courses/${level.slug}/${category.slug}/${topic.slug}/test`;

  return (
    <div className="space-y-8">
      <CourseBreadcrumbs items={breadcrumbs} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">{level.code}</Badge>
          <Badge variant="default">{category.name}</Badge>
          <Badge variant="default" className="capitalize">
            {topic.difficulty.toLowerCase()}
          </Badge>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {topic.title}
        </h1>
        <p className="max-w-2xl text-muted-foreground">{topic.description}</p>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          {tCourses("subtopics")}
        </h2>
        <ul className="space-y-2">
          {topic.subtopics.map((subtopic) => {
            const href = `/courses/${level.slug}/${category.slug}/${topic.slug}/${subtopic.slug}`;
            const config = statusIcons[subtopic.status];
            const Icon = config.icon;
            const isLocked = subtopic.status === "LOCKED";

            return (
              <li key={subtopic.slug}>
                <Card
                  className={cn(
                    "transition-colors",
                    !isLocked && "hover:border-primary/40",
                  )}
                >
                  {isLocked ? (
                    <CardContent className="flex items-start gap-3 p-4 opacity-70">
                      <Icon
                        className={cn("mt-0.5 h-5 w-5 shrink-0", config.className)}
                        aria-hidden
                      />
                      <div>
                        <p className="font-medium">{subtopic.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {subtopic.description}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {tCourses("lockedNote")}
                        </p>
                      </div>
                    </CardContent>
                  ) : (
                    <Link href={href} className="block">
                      <CardContent className="flex items-start gap-3 p-4">
                        <Icon
                          className={cn(
                            "mt-0.5 h-5 w-5 shrink-0",
                            config.className,
                          )}
                          aria-hidden
                        />
                        <div>
                          <p className="font-medium transition-colors group-hover:text-primary">
                            {subtopic.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {subtopic.description}
                          </p>
                        </div>
                      </CardContent>
                    </Link>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">{tCourses("topicFinalTest")}</p>
              <p className="text-sm text-muted-foreground">
                {tCourses("topicFinalTestNote")}
              </p>
            </div>
          </div>
          <Link
            href={getQuizHref(topic.topicFinalQuizId, testFallback)}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow)] transition-colors hover:bg-primary-hover"
          >
            {tCourses("startTest")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
