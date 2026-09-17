"use client";

import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Lock,
  PlayCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { getQuizHref } from "@/lib/curriculum";
import type {
  CurriculumCategory,
  CurriculumLevelTree,
} from "@/types/curriculum";
import type { ProgressStatus } from "@/types";
import { cn } from "@/lib/utils";

interface CourseTreeProps {
  level: CurriculumLevelTree;
}

const statusConfig: Record<
  ProgressStatus,
  {
    label: string;
    icon: typeof Lock;
    className: string;
  }
> = {
  LOCKED: {
    label: "Locked",
    icon: Lock,
    className: "text-muted-foreground/60",
  },
  AVAILABLE: {
    label: "Available",
    icon: Circle,
    className: "text-primary",
  },
  IN_PROGRESS: {
    label: "In progress",
    icon: PlayCircle,
    className: "text-accent",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    className: "text-success",
  },
};

function StatusIcon({ status }: { status: ProgressStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex shrink-0", config.className)} title={config.label}>
      <Icon className="h-4 w-4" aria-hidden />
      <span className="sr-only">{config.label}</span>
    </span>
  );
}

function TopicBlock({
  levelSlug,
  category,
  topic,
}: {
  levelSlug: string;
  category: CurriculumCategory;
  topic: CurriculumCategory["topics"][number];
}) {
  const topicHref = `/courses/${levelSlug}/${category.slug}/${topic.slug}`;
  const testFallback = `${topicHref}/test`;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={topicHref}
            className="font-medium text-foreground transition-colors hover:text-primary"
          >
            {topic.title}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {topic.description}
          </p>
        </div>
        <Badge variant="default" className="shrink-0 capitalize">
          {topic.difficulty.toLowerCase()}
        </Badge>
      </div>

      <ul className="space-y-1">
        {topic.subtopics.map((subtopic) => {
          const href = `/courses/${levelSlug}/${category.slug}/${topic.slug}/${subtopic.slug}`;
          const isLocked = subtopic.status === "LOCKED";

          return (
            <li key={subtopic.slug}>
              {isLocked ? (
                <div
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground/70"
                  aria-disabled
                >
                  <StatusIcon status={subtopic.status} />
                  <span>{subtopic.title}</span>
                </div>
              ) : (
                <Link
                  href={href}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
                >
                  <StatusIcon status={subtopic.status} />
                  <span>{subtopic.title}</span>
                </Link>
              )}
            </li>
          );
        })}

        <li>
          <Link
            href={getQuizHref(topic.topicFinalQuizId, testFallback)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
            <span>Final Topic Test</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}

export function CourseTree({ level }: CourseTreeProps) {
  const defaultOpen = level.categories.map((category) => category.slug);

  return (
    <Accordion type="multiple" defaultValue={defaultOpen}>
      {level.categories.map((category) => (
        <AccordionItem key={category.slug} value={category.slug}>
          <AccordionTrigger value={category.slug}>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-semibold">
                  {category.name}
                </span>
                <Badge variant="primary">{category.topics.length} topics</Badge>
              </div>
              <p className="text-sm font-normal text-muted-foreground">
                {category.description}
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent value={category.slug}>
            <div className="space-y-6">
              {category.topics.map((topic) => (
                <TopicBlock
                  key={topic.slug}
                  levelSlug={level.slug}
                  category={category}
                  topic={topic}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
