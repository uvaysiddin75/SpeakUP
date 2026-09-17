import { CefrCode, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LEVEL_META } from "@/lib/curriculum";

export type SkillLevelCode = (typeof LEVEL_META)[number]["code"];

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

function asWordMeaning(
  value: unknown,
): Array<{ word: string; meaning: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      if (typeof row.word !== "string") return null;
      return {
        word: row.word,
        meaning: typeof row.meaning === "string" ? row.meaning : "",
      };
    })
    .filter((item): item is { word: string; meaning: string } => Boolean(item));
}

export async function listVocabularyTopics(levelCode?: SkillLevelCode) {
  return prisma.vocabularyTopic.findMany({
    where: {
      isPublished: true,
      ...(levelCode ? { levelCode: levelCode as CefrCode } : {}),
    },
    include: {
      _count: { select: { words: true } },
      quiz: { select: { id: true } },
    },
    orderBy: [{ levelCode: "asc" }, { order: "asc" }],
  });
}

export async function getVocabularyTopic(levelSlug: string, topicSlug: string) {
  const levelCode = levelSlug.toUpperCase() as CefrCode;
  return prisma.vocabularyTopic.findUnique({
    where: {
      levelCode_slug: { levelCode, slug: topicSlug },
    },
    include: {
      words: { where: { isPublished: true }, orderBy: { order: "asc" } },
      quiz: { select: { id: true, questionCount: true, passScore: true } },
    },
  });
}

export async function listReadingLessons(levelCode?: SkillLevelCode) {
  return prisma.readingText.findMany({
    where: {
      isPublished: true,
      ...(levelCode ? { levelCode: levelCode as CefrCode } : {}),
    },
    include: {
      _count: { select: { questions: true } },
      quiz: { select: { id: true } },
    },
    orderBy: [{ levelCode: "asc" }, { order: "asc" }],
  });
}

export async function getReadingLesson(levelSlug: string, lessonSlug: string) {
  const levelCode = levelSlug.toUpperCase() as CefrCode;
  const lesson = await prisma.readingText.findUnique({
    where: { levelCode_slug: { levelCode, slug: lessonSlug } },
    include: {
      questions: { orderBy: { order: "asc" } },
      quiz: { select: { id: true, questionCount: true, passScore: true } },
    },
  });
  if (!lesson) return null;
  return {
    ...lesson,
    vocabulary: asWordMeaning(lesson.vocabulary),
    importantWords: asStringArray(lesson.importantWords),
  };
}

export async function listListeningLessons(levelCode?: SkillLevelCode) {
  return prisma.listeningTask.findMany({
    where: {
      isPublished: true,
      ...(levelCode ? { levelCode: levelCode as CefrCode } : {}),
    },
    include: {
      _count: { select: { questions: true } },
      quiz: { select: { id: true } },
    },
    orderBy: [{ levelCode: "asc" }, { order: "asc" }],
  });
}

export async function getListeningLesson(levelSlug: string, lessonSlug: string) {
  const levelCode = levelSlug.toUpperCase() as CefrCode;
  const lesson = await prisma.listeningTask.findUnique({
    where: { levelCode_slug: { levelCode, slug: lessonSlug } },
    include: {
      questions: { orderBy: { order: "asc" } },
      quiz: { select: { id: true, questionCount: true, passScore: true } },
    },
  });
  if (!lesson) return null;
  return {
    ...lesson,
    vocabulary: asWordMeaning(lesson.vocabulary),
  };
}

export async function listSpeakingLessons(levelCode?: SkillLevelCode) {
  return prisma.speakingTask.findMany({
    where: {
      isPublished: true,
      ...(levelCode ? { levelCode: levelCode as CefrCode } : {}),
    },
    include: {
      quiz: { select: { id: true } },
    },
    orderBy: [{ levelCode: "asc" }, { order: "asc" }],
  });
}

export async function getSpeakingLesson(levelSlug: string, lessonSlug: string) {
  const levelCode = levelSlug.toUpperCase() as CefrCode;
  const lesson = await prisma.speakingTask.findUnique({
    where: { levelCode_slug: { levelCode, slug: lessonSlug } },
  });
  if (!lesson) return null;
  return {
    ...lesson,
    usefulVocabulary: asStringArray(lesson.usefulVocabulary),
    usefulPhrases: asStringArray(lesson.usefulPhrases),
  };
}

export async function getSkillDashboardCounts() {
  const [vocabulary, reading, listening, speaking] = await Promise.all([
    prisma.vocabularyTopic.count({ where: { isPublished: true } }),
    prisma.readingText.count({ where: { isPublished: true } }),
    prisma.listeningTask.count({ where: { isPublished: true } }),
    prisma.speakingTask.count({ where: { isPublished: true } }),
  ]);
  return { vocabulary, reading, listening, speaking };
}

export type JsonVocab = Prisma.JsonValue;
