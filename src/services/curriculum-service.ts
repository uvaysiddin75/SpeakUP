import { QuizType } from "@prisma/client";
import { CURRICULUM_TREE } from "@/data/curriculum/tree";
import { buildLessonContent } from "@/data/curriculum/questions";
import {
  CATEGORY_META,
  LEVEL_META,
  type CategoryTypeValue,
} from "@/lib/curriculum";
import { prisma } from "@/lib/prisma";
import { stableId } from "@/lib/stable-id";
import type {
  BreadcrumbItem,
  CurriculumCategory,
  CurriculumLevelTree,
  CurriculumSubtopic,
  CurriculumTopic,
  LessonExample,
  LessonVocabularyItem,
  SubtopicDetail,
  SubtopicLesson,
} from "@/types/curriculum";
import type {
  CategoryType,
  CefrLevelCode,
  Difficulty,
  ProgressStatus,
} from "@/types";

export type {
  BreadcrumbItem,
  CurriculumCategory,
  CurriculumLevelTree,
  CurriculumSubtopic,
  CurriculumTopic,
  SubtopicDetail,
} from "@/types/curriculum";

function assignSubtopicStatuses(
  subtopics: Omit<CurriculumSubtopic, "status">[],
): CurriculumSubtopic[] {
  return subtopics.map((subtopic, index) => ({
    ...subtopic,
    status: index === 0 ? "AVAILABLE" : "LOCKED",
  }));
}

function countSubtopics(categories: CurriculumCategory[]): number {
  return categories.reduce(
    (sum, category) =>
      sum +
      category.topics.reduce(
        (topicSum, topic) => topicSum + topic.subtopics.length,
        0,
      ),
    0,
  );
}

function buildLevelTreeFromStatic(levelSlug: string): CurriculumLevelTree | null {
  const meta = LEVEL_META.find((level) => level.slug === levelSlug);
  if (!meta) return null;

  const seed = CURRICULUM_TREE.find((level) => level.code === meta.code);
  if (!seed) return null;

  const categories: CurriculumCategory[] = seed.categories.map(
    (categorySeed, catIndex) => {
      const catMeta = CATEGORY_META[categorySeed.type as CategoryTypeValue];

      const topics: CurriculumTopic[] = categorySeed.topics.map(
        (topicSeed, topicIndex) => {
          const topicId = stableId(
            "top",
            `${meta.code}:${categorySeed.type}:${topicSeed.slug}`,
          );

          const subtopics = assignSubtopicStatuses(
            topicSeed.subtopics.map((subSeed, subIndex) => {
              const subtopicId = stableId(
                "sub",
                `${meta.code}:${categorySeed.type}:${topicSeed.slug}:${subSeed.slug}`,
              );
              return {
                slug: subSeed.slug,
                title: subSeed.title,
                description: subSeed.description,
                order: subIndex + 1,
                quizId: stableId("quiz", `sub:${subtopicId}`),
              };
            }),
          );

          return {
            slug: topicSeed.slug,
            title: topicSeed.title,
            description: topicSeed.description,
            order: topicIndex + 1,
            difficulty: topicSeed.difficulty,
            subtopics,
            topicFinalQuizId: stableId("quiz", `topic:${topicId}`),
          };
        },
      );

      return {
        type: categorySeed.type,
        slug: catMeta.slug,
        name: catMeta.name,
        description: catMeta.description,
        order: catIndex + 1,
        topics,
      };
    },
  );

  const totalSubtopics = countSubtopics(categories);

  return {
    code: meta.code,
    slug: meta.slug,
    name: meta.name,
    description: meta.description,
    order: meta.order,
    categories,
    progressPercent: 0,
    totalSubtopics,
    completedSubtopics: 0,
  };
}

async function buildLevelTreeFromDb(
  levelSlug: string,
  userId?: string,
): Promise<CurriculumLevelTree | null> {
  const level = await prisma.level.findUnique({
    where: { slug: levelSlug, isPublished: true },
    include: {
      progress: userId ? { where: { userId }, take: 1 } : false,
      categories: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
        include: {
          topics: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
            include: {
              progress: userId ? { where: { userId }, take: 1 } : false,
              subtopics: {
                where: { isPublished: true },
                orderBy: { order: "asc" },
                include: {
                  progress: userId ? { where: { userId }, take: 1 } : false,
                  quizzes: {
                    where: { type: QuizType.SUBTOPIC, isPublished: true },
                    take: 1,
                    select: { id: true },
                  },
                },
              },
              quizzes: {
                where: { type: QuizType.TOPIC_FINAL, isPublished: true },
                take: 1,
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!level) return null;

  // Ensure unlock state for authenticated users (first visit seeds AVAILABLE)
  if (userId) {
    const { ensureTopicUnlockState } = await import("@/services/progress-service");
    for (const category of level.categories) {
      for (const topic of category.topics) {
        await ensureTopicUnlockState(userId, topic.id);
      }
    }
    // Reload progress after unlock
    return buildLevelTreeFromDb(levelSlug, undefined).then(async (tree) => {
      // Re-fetch with user progress (avoid infinite loop by not calling ensure again)
      const refreshed = await prisma.level.findUnique({
        where: { id: level.id },
        include: {
          progress: { where: { userId }, take: 1 },
          categories: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
            include: {
              topics: {
                where: { isPublished: true },
                orderBy: { order: "asc" },
                include: {
                  progress: { where: { userId }, take: 1 },
                  subtopics: {
                    where: { isPublished: true },
                    orderBy: { order: "asc" },
                    include: {
                      progress: { where: { userId }, take: 1 },
                      quizzes: {
                        where: { type: QuizType.SUBTOPIC, isPublished: true },
                        take: 1,
                        select: { id: true },
                      },
                    },
                  },
                  quizzes: {
                    where: { type: QuizType.TOPIC_FINAL, isPublished: true },
                    take: 1,
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      });
      if (!refreshed) return tree;

      let completedSubtopics = 0;
      const categories: CurriculumCategory[] = refreshed.categories.map((category) => ({
        type: category.type as CategoryType,
        slug: category.slug,
        name: category.name,
        description: category.description,
        order: category.order,
        topics: category.topics.map((topic) => {
          const subtopics: CurriculumSubtopic[] = topic.subtopics.map((subtopic) => {
            const st = subtopic.progress[0]?.status;
            if (st === "COMPLETED" || st === "MASTERED") completedSubtopics += 1;
            return {
              slug: subtopic.slug,
              title: subtopic.title,
              description: subtopic.description,
              order: subtopic.order,
              quizId: subtopic.quizzes[0]?.id ?? null,
              status: (st ?? "LOCKED") as ProgressStatus,
            };
          });
          return {
            slug: topic.slug,
            title: topic.title,
            description: topic.description,
            order: topic.order,
            difficulty: topic.difficulty as Difficulty,
            subtopics,
            topicFinalQuizId: topic.quizzes[0]?.id ?? null,
          };
        }),
      }));

      const totalSubtopics = countSubtopics(categories);
      return {
        code: refreshed.code as CefrLevelCode,
        slug: refreshed.slug,
        name: refreshed.name,
        description: refreshed.description,
        order: refreshed.order,
        categories,
        progressPercent: refreshed.progress[0]?.percent ?? 0,
        totalSubtopics,
        completedSubtopics,
      };
    });
  }

  const categories: CurriculumCategory[] = level.categories.map((category) => ({
    type: category.type as CategoryType,
    slug: category.slug,
    name: category.name,
    description: category.description,
    order: category.order,
    topics: category.topics.map((topic) => ({
      slug: topic.slug,
      title: topic.title,
      description: topic.description,
      order: topic.order,
      difficulty: topic.difficulty as Difficulty,
      subtopics: assignSubtopicStatuses(
        topic.subtopics.map((subtopic) => ({
          slug: subtopic.slug,
          title: subtopic.title,
          description: subtopic.description,
          order: subtopic.order,
          quizId: subtopic.quizzes[0]?.id ?? null,
        })),
      ),
      topicFinalQuizId: topic.quizzes[0]?.id ?? null,
    })),
  }));

  const totalSubtopics = countSubtopics(categories);

  return {
    code: level.code as CefrLevelCode,
    slug: level.slug,
    name: level.name,
    description: level.description,
    order: level.order,
    categories,
    progressPercent: 0,
    totalSubtopics,
    completedSubtopics: 0,
  };
}

export async function getLevelTree(
  levelSlug: string,
  userId?: string,
): Promise<CurriculumLevelTree | null> {
  try {
    const fromDb = await buildLevelTreeFromDb(levelSlug, userId);
    if (fromDb) return fromDb;
  } catch {
    // Database unavailable — fall back to static curriculum
  }

  return buildLevelTreeFromStatic(levelSlug);
}

export async function getCategoryFromLevel(
  levelSlug: string,
  categorySlug: string,
  userId?: string,
): Promise<{ level: CurriculumLevelTree; category: CurriculumCategory } | null> {
  const level = await getLevelTree(levelSlug, userId);
  if (!level) return null;

  const category = level.categories.find((item) => item.slug === categorySlug);
  if (!category) return null;

  return { level, category };
}

export async function getTopicFromLevel(
  levelSlug: string,
  categorySlug: string,
  topicSlug: string,
  userId?: string,
): Promise<{
  level: CurriculumLevelTree;
  category: CurriculumCategory;
  topic: CurriculumTopic;
} | null> {
  const result = await getCategoryFromLevel(levelSlug, categorySlug, userId);
  if (!result) return null;

  const topic = result.category.topics.find((item) => item.slug === topicSlug);
  if (!topic) return null;

  return { ...result, topic };
}

function parseJsonArray<T>(value: unknown): T[] | null {
  if (!Array.isArray(value)) return null;
  return value as T[];
}

async function loadLessonFromDb(
  levelSlug: string,
  categorySlug: string,
  topicSlug: string,
  subtopicSlug: string,
): Promise<SubtopicDetail | null> {
  const subtopic = await prisma.subtopic.findFirst({
    where: {
      slug: subtopicSlug,
      isPublished: true,
      topic: {
        slug: topicSlug,
        isPublished: true,
        category: {
          slug: categorySlug,
          isPublished: true,
          level: { slug: levelSlug, isPublished: true },
        },
      },
    },
    include: {
      lesson: true,
      practice: { select: { id: true } },
      quizzes: {
        where: { type: QuizType.SUBTOPIC, isPublished: true },
        take: 1,
        select: { id: true },
      },
      topic: {
        include: {
          category: {
            include: { level: true },
          },
        },
      },
    },
  });

  if (!subtopic) return null;

  const { topic } = subtopic;
  const { category } = topic;
  const { level } = category;

  const siblings = await prisma.subtopic.findMany({
    where: { topicId: topic.id, isPublished: true },
    orderBy: { order: "asc" },
    select: { id: true, slug: true },
  });
  const subtopicIndex = siblings.findIndex((item) => item.slug === subtopicSlug);
  let status: ProgressStatus =
    subtopicIndex === 0 ? "AVAILABLE" : "LOCKED";
  let lessonDone = false;
  let progressPercent = 0;

  // Optional user progress — caller may pass via ensure
  try {
    const { auth } = await import("@/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (userId) {
      const { ensureTopicUnlockState } = await import(
        "@/services/progress-service"
      );
      await ensureTopicUnlockState(userId, topic.id);
      const progress = await prisma.subtopicProgress.findUnique({
        where: { userId_subtopicId: { userId, subtopicId: subtopic.id } },
      });
      if (progress) {
        status = progress.status as ProgressStatus;
        lessonDone = progress.lessonDone;
        progressPercent = progress.progressPercent;
      }
    }
  } catch {
    // guest / auth unavailable
  }

  const placeholder = buildLessonContent({
    topicTitle: topic.title,
    subtopicTitle: subtopic.title,
    levelCode: level.code,
    categoryType: category.type,
  });

  const lesson: SubtopicLesson = subtopic.lesson
    ? {
        explanation: subtopic.lesson.explanation,
        examples:
          parseJsonArray<LessonExample>(subtopic.lesson.examples) ??
          placeholder.examples,
        vocabulary: parseJsonArray<LessonVocabularyItem>(
          subtopic.lesson.vocabulary,
        ),
        tips: subtopic.lesson.tips,
        estimatedMin: subtopic.lesson.estimatedMin,
        practiceId: subtopic.practice?.id ?? null,
      }
    : {
        explanation: placeholder.explanation,
        examples: placeholder.examples,
        vocabulary: placeholder.vocabulary,
        tips: placeholder.tips ?? null,
        estimatedMin: 10,
        practiceId: subtopic.practice?.id ?? null,
      };

  return {
    id: subtopic.id,
    slug: subtopic.slug,
    title: subtopic.title,
    description: subtopic.description,
    order: subtopic.order,
    status,
    quizId: subtopic.quizzes[0]?.id ?? null,
    levelSlug: level.slug,
    levelCode: level.code as CefrLevelCode,
    categorySlug: category.slug,
    categoryName: category.name,
    categoryType: category.type as CategoryType,
    topicSlug: topic.slug,
    topicTitle: topic.title,
    lesson,
    lessonDone,
    progressPercent,
  };
}

function loadLessonFromStatic(
  levelSlug: string,
  categorySlug: string,
  topicSlug: string,
  subtopicSlug: string,
): SubtopicDetail | null {
  const level = buildLevelTreeFromStatic(levelSlug);
  if (!level) return null;

  const category = level.categories.find((item) => item.slug === categorySlug);
  if (!category) return null;

  const topic = category.topics.find((item) => item.slug === topicSlug);
  if (!topic) return null;

  const subtopic = topic.subtopics.find((item) => item.slug === subtopicSlug);
  if (!subtopic) return null;

  const placeholder = buildLessonContent({
    topicTitle: topic.title,
    subtopicTitle: subtopic.title,
    levelCode: level.code,
    categoryType: category.type,
  });

  return {
    ...subtopic,
    id: `static-${level.slug}-${category.slug}-${topic.slug}-${subtopic.slug}`,
    levelSlug: level.slug,
    levelCode: level.code,
    categorySlug: category.slug,
    categoryName: category.name,
    categoryType: category.type,
    topicSlug: topic.slug,
    topicTitle: topic.title,
    lesson: {
      explanation: placeholder.explanation,
      examples: placeholder.examples,
      vocabulary: placeholder.vocabulary,
      tips: placeholder.tips ?? null,
      estimatedMin: 10,
      practiceId: null,
    },
    lessonDone: false,
    progressPercent: 0,
  };
}

export async function getSubtopicDetail(
  levelSlug: string,
  categorySlug: string,
  topicSlug: string,
  subtopicSlug: string,
): Promise<SubtopicDetail | null> {
  try {
    const fromDb = await loadLessonFromDb(
      levelSlug,
      categorySlug,
      topicSlug,
      subtopicSlug,
    );
    if (fromDb) return fromDb;
  } catch {
    // Database unavailable — fall back to static curriculum
  }

  return loadLessonFromStatic(levelSlug, categorySlug, topicSlug, subtopicSlug);
}

export type PracticeDetail = {
  id: string;
  title: string;
  instructions: string | null;
  items: Array<{
    id: string;
    type: string;
    prompt: string;
    options: unknown;
    explanation: string | null;
    order: number;
  }>;
  subtopic: SubtopicDetail;
};

export async function getPracticeDetail(
  levelSlug: string,
  categorySlug: string,
  topicSlug: string,
  subtopicSlug: string,
): Promise<PracticeDetail | null> {
  const subtopic = await getSubtopicDetail(
    levelSlug,
    categorySlug,
    topicSlug,
    subtopicSlug,
  );
  if (!subtopic) return null;

  try {
    const practice = await prisma.practice.findFirst({
      where: {
        subtopic: {
          slug: subtopicSlug,
          topic: {
            slug: topicSlug,
            category: {
              slug: categorySlug,
              level: { slug: levelSlug },
            },
          },
        },
      },
      include: {
        items: { orderBy: { order: "asc" } },
      },
    });

    if (practice) {
      return {
        id: practice.id,
        title: practice.title,
        instructions: practice.instructions,
        items: practice.items.map((item) => ({
          id: item.id,
          type: item.type,
          prompt: item.prompt,
          options: item.options,
          explanation: item.explanation,
          order: item.order,
        })),
        subtopic,
      };
    }
  } catch {
    // fall through to placeholder practice
  }

  return {
    id: "static-practice",
    title: `${subtopic.title} Practice`,
    instructions: "Warm-up items before the graded test.",
    items: [],
    subtopic,
  };
}

export function buildCourseBreadcrumbs(params: {
  levelCode: CefrLevelCode;
  levelSlug: string;
  levelName: string;
  categoryName?: string;
  categorySlug?: string;
  topicTitle?: string;
  topicSlug?: string;
  subtopicTitle?: string;
}): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: "Courses", href: "/courses" },
    {
      label: `${params.levelCode} · ${params.levelName}`,
      href: `/courses/${params.levelSlug}`,
    },
  ];

  if (params.categoryName && params.categorySlug) {
    items.push({
      label: params.categoryName,
      href: `/courses/${params.levelSlug}/${params.categorySlug}`,
    });
  }

  if (params.topicTitle && params.categorySlug && params.topicSlug) {
    items.push({
      label: params.topicTitle,
      href: `/courses/${params.levelSlug}/${params.categorySlug}/${params.topicSlug}`,
    });
  }

  if (params.subtopicTitle) {
    items.push({ label: params.subtopicTitle });
  }

  return items;
}
