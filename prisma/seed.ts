/**
 * SpeakUp curriculum seed
 * Level → Category → Topic → Subtopic → Lesson/Practice/Quiz/Questions
 */
import {
  CategoryType,
  CefrCode,
  Difficulty,
  PrismaClient,
  QuestionType,
  QuizType,
  Role,
} from "@prisma/client";
import { createHash } from "crypto";
import {
  CATEGORY_META,
  LEVEL_META,
  PASSING_SCORE,
  QUIZ_QUESTION_COUNTS,
} from "../src/lib/curriculum";
import { buildLessonContent, generateSubtopicQuestions } from "../src/data/curriculum/questions";
import { CURRICULUM_TREE } from "../src/data/curriculum/tree";
import type { SeedQuestion } from "../src/data/curriculum/types";
import { seedSkillContent } from "./seed-skills";

const prisma = new PrismaClient();

function toJson(value: unknown) {
  return value as object;
}

function mapDifficulty(value: string): Difficulty {
  if (value === "HARD") return Difficulty.HARD;
  if (value === "MEDIUM") return Difficulty.MEDIUM;
  return Difficulty.EASY;
}

function mapQuestionType(value: SeedQuestion["type"]): QuestionType {
  return QuestionType[value];
}

function stableId(prefix: string, key: string) {
  const hash = createHash("sha256").update(key).digest("hex").slice(0, 24);
  return `${prefix}_${hash}`;
}

async function seedAdmin() {
  const passwordHash =
    "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"; // "password" placeholder for Stage 4

  await prisma.user.upsert({
    where: { email: "admin@speakup.local" },
    update: {},
    create: {
      id: "user_admin_speakup",
      username: "admin",
      email: "admin@speakup.local",
      passwordHash,
      role: Role.ADMIN,
      currentLevel: CefrCode.A1,
      settings: {
        create: {
          language: "en",
          theme: "system",
        },
      },
    },
  });
}

async function createQuestionsForSubtopic(params: {
  subtopicId: string;
  levelCode: string;
  categoryType: string;
  topicTitle: string;
  topicSlug: string;
  subtopicTitle: string;
  subtopicSlug: string;
}) {
  const generated = generateSubtopicQuestions({
    levelCode: params.levelCode,
    categoryType: params.categoryType,
    topicTitle: params.topicTitle,
    topicSlug: params.topicSlug,
    subtopicTitle: params.subtopicTitle,
    subtopicSlug: params.subtopicSlug,
    count: QUIZ_QUESTION_COUNTS.SUBTOPIC,
  });

  const questionIds: string[] = [];

  for (let index = 0; index < generated.length; index += 1) {
    const q = generated[index]!;
    const id = stableId(
      "q",
      `${params.subtopicId}:${index}:${q.prompt.slice(0, 48)}`,
    );
    await prisma.question.upsert({
      where: { id },
      update: {
        prompt: q.prompt,
        options: q.options ? toJson(q.options) : undefined,
        correctAnswer: toJson(q.correctAnswer),
        explanation: q.explanation,
        difficulty: mapDifficulty(q.difficulty ?? "EASY"),
        type: mapQuestionType(q.type),
        tags: q.tags ?? [params.topicSlug, params.subtopicSlug],
        subtopicId: params.subtopicId,
        isPublished: true,
      },
      create: {
        id,
        subtopicId: params.subtopicId,
        type: mapQuestionType(q.type),
        prompt: q.prompt,
        options: q.options ? toJson(q.options) : undefined,
        correctAnswer: toJson(q.correctAnswer),
        explanation: q.explanation,
        difficulty: mapDifficulty(q.difficulty ?? "EASY"),
        tags: q.tags ?? [params.topicSlug, params.subtopicSlug],
        isPublished: true,
      },
    });
    questionIds.push(id);
  }

  return questionIds;
}

async function attachQuestionsToQuiz(quizId: string, questionIds: string[]) {
  await prisma.quizQuestion.deleteMany({ where: { quizId } });
  if (questionIds.length === 0) return;

  await prisma.quizQuestion.createMany({
    data: questionIds.map((questionId, order) => ({
      id: stableId("qq", `${quizId}:${questionId}`),
      quizId,
      questionId,
      order,
    })),
  });
}

async function upsertQuiz(params: {
  id: string;
  type: QuizType;
  title: string;
  description: string;
  questionCount: number;
  levelId?: string;
  categoryId?: string;
  topicId?: string;
  subtopicId?: string;
}) {
  return prisma.quiz.upsert({
    where: { id: params.id },
    update: {
      title: params.title,
      description: params.description,
      questionCount: params.questionCount,
      passScore: PASSING_SCORE,
      isPublished: true,
      type: params.type,
      levelId: params.levelId,
      categoryId: params.categoryId,
      topicId: params.topicId,
      subtopicId: params.subtopicId,
    },
    create: {
      id: params.id,
      type: params.type,
      title: params.title,
      description: params.description,
      questionCount: params.questionCount,
      passScore: PASSING_SCORE,
      isPublished: true,
      levelId: params.levelId,
      categoryId: params.categoryId,
      topicId: params.topicId,
      subtopicId: params.subtopicId,
    },
  });
}

async function main() {
  console.log("🌱 Seeding SpeakUp curriculum...\n");

  await seedAdmin();
  console.log("✓ admin user");

  // Rich skill content for Vocabulary / Reading / Listening / Speaking
  const skillTotals = await seedSkillContent(prisma);
  console.log("✓ skill content");
  console.table(skillTotals);

  const topicQuestionBank = new Map<string, string[]>();
  const categoryQuestionBank = new Map<string, string[]>();
  const levelQuestionBank = new Map<string, string[]>();

  const totals = {
    levels: 0,
    categories: 0,
    topics: 0,
    subtopics: 0,
    lessons: 0,
    questions: 0,
    quizzes: 0,
  };

  for (const levelMeta of LEVEL_META) {
    const treeLevel = CURRICULUM_TREE.find((l) => l.code === levelMeta.code);
    if (!treeLevel) continue;

    const level = await prisma.level.upsert({
      where: { code: levelMeta.code as CefrCode },
      update: {
        slug: levelMeta.slug,
        name: levelMeta.name,
        description: levelMeta.description,
        order: levelMeta.order,
        isPublished: true,
      },
      create: {
        id: stableId("lvl", levelMeta.code),
        code: levelMeta.code as CefrCode,
        slug: levelMeta.slug,
        name: levelMeta.name,
        description: levelMeta.description,
        order: levelMeta.order,
        isPublished: true,
      },
    });
    totals.levels += 1;
    levelQuestionBank.set(level.id, []);

    for (const [catIndex, categorySeed] of treeLevel.categories.entries()) {
      const meta = CATEGORY_META[categorySeed.type];
      const category = await prisma.category.upsert({
        where: {
          levelId_type: {
            levelId: level.id,
            type: categorySeed.type as CategoryType,
          },
        },
        update: {
          slug: meta.slug,
          name: meta.name,
          description: meta.description,
          order: catIndex + 1,
          isPublished: true,
        },
        create: {
          id: stableId("cat", `${level.code}:${categorySeed.type}`),
          levelId: level.id,
          type: categorySeed.type as CategoryType,
          slug: meta.slug,
          name: meta.name,
          description: meta.description,
          order: catIndex + 1,
          isPublished: true,
        },
      });
      totals.categories += 1;
      categoryQuestionBank.set(category.id, []);

      for (const [topicIndex, topicSeed] of categorySeed.topics.entries()) {
        const topic = await prisma.topic.upsert({
          where: {
            categoryId_slug: {
              categoryId: category.id,
              slug: topicSeed.slug,
            },
          },
          update: {
            title: topicSeed.title,
            description: topicSeed.description,
            order: topicIndex + 1,
            difficulty: mapDifficulty(topicSeed.difficulty),
            isPublished: true,
            isRequired: true,
          },
          create: {
            id: stableId("top", `${level.code}:${category.type}:${topicSeed.slug}`),
            categoryId: category.id,
            slug: topicSeed.slug,
            title: topicSeed.title,
            description: topicSeed.description,
            order: topicIndex + 1,
            difficulty: mapDifficulty(topicSeed.difficulty),
            isPublished: true,
            isRequired: true,
          },
        });
        totals.topics += 1;
        topicQuestionBank.set(topic.id, []);

        for (const [subIndex, subSeed] of topicSeed.subtopics.entries()) {
          const subtopic = await prisma.subtopic.upsert({
            where: {
              topicId_slug: {
                topicId: topic.id,
                slug: subSeed.slug,
              },
            },
            update: {
              title: subSeed.title,
              description: subSeed.description,
              order: subIndex + 1,
              isPublished: true,
              isRequired: true,
            },
            create: {
              id: stableId(
                "sub",
                `${level.code}:${category.type}:${topicSeed.slug}:${subSeed.slug}`,
              ),
              topicId: topic.id,
              slug: subSeed.slug,
              title: subSeed.title,
              description: subSeed.description,
              order: subIndex + 1,
              isPublished: true,
              isRequired: true,
            },
          });
          totals.subtopics += 1;

          if (!subSeed.withContent) continue;

          const lesson = buildLessonContent({
            topicTitle: topicSeed.title,
            subtopicTitle: subSeed.title,
            levelCode: level.code,
            categoryType: category.type,
          });

          await prisma.lesson.upsert({
            where: { subtopicId: subtopic.id },
            update: {
              explanation: lesson.explanation,
              examples: toJson(lesson.examples),
              vocabulary: toJson(lesson.vocabulary),
              tips: lesson.tips,
              estimatedMin: 10,
            },
            create: {
              id: stableId("les", subtopic.id),
              subtopicId: subtopic.id,
              explanation: lesson.explanation,
              examples: toJson(lesson.examples),
              vocabulary: toJson(lesson.vocabulary),
              tips: lesson.tips,
              estimatedMin: 10,
            },
          });
          totals.lessons += 1;

          const practiceId = stableId("pra", subtopic.id);
          await prisma.practice.upsert({
            where: { subtopicId: subtopic.id },
            update: {
              title: `${subSeed.title} Practice`,
              instructions: "Complete the warm-up items before the graded test.",
            },
            create: {
              id: practiceId,
              subtopicId: subtopic.id,
              title: `${subSeed.title} Practice`,
              instructions: "Complete the warm-up items before the graded test.",
            },
          });

          await prisma.practiceItem.deleteMany({ where: { practiceId } });
          const practiceQuestions = generateSubtopicQuestions({
            levelCode: level.code,
            categoryType: category.type,
            topicTitle: topicSeed.title,
            topicSlug: topicSeed.slug,
            subtopicTitle: `${subSeed.title} practice`,
            subtopicSlug: `${subSeed.slug}-practice`,
            count: 5,
          });
          await prisma.practiceItem.createMany({
            data: practiceQuestions.map((item, order) => ({
              id: stableId("pi", `${practiceId}:${order}`),
              practiceId,
              type: mapQuestionType(item.type),
              prompt: item.prompt,
              options: item.options ? toJson(item.options) : undefined,
              correctAnswer: toJson(item.correctAnswer),
              explanation: item.explanation,
              order,
            })),
          });

          const questionIds = await createQuestionsForSubtopic({
            subtopicId: subtopic.id,
            levelCode: level.code,
            categoryType: category.type,
            topicTitle: topicSeed.title,
            topicSlug: topicSeed.slug,
            subtopicTitle: subSeed.title,
            subtopicSlug: subSeed.slug,
          });
          totals.questions += questionIds.length;

          topicQuestionBank.get(topic.id)!.push(...questionIds);
          categoryQuestionBank.get(category.id)!.push(...questionIds);
          levelQuestionBank.get(level.id)!.push(...questionIds);

          const subQuiz = await upsertQuiz({
            id: stableId("quiz", `sub:${subtopic.id}`),
            type: QuizType.SUBTOPIC,
            title: `${subSeed.title} Test`,
            description: `20 questions for ${topicSeed.title} → ${subSeed.title}`,
            questionCount: QUIZ_QUESTION_COUNTS.SUBTOPIC,
            levelId: level.id,
            categoryId: category.id,
            topicId: topic.id,
            subtopicId: subtopic.id,
          });
          await attachQuestionsToQuiz(subQuiz.id, questionIds.slice(0, 20));
          totals.quizzes += 1;
        }

        // Topic final quiz
        const topicBank = uniqueSlice(
          topicQuestionBank.get(topic.id) ?? [],
          QUIZ_QUESTION_COUNTS.TOPIC_FINAL,
        );
        const topicQuiz = await upsertQuiz({
          id: stableId("quiz", `topic:${topic.id}`),
          type: QuizType.TOPIC_FINAL,
          title: `${topicSeed.title} Final Test`,
          description: `Final test covering all subtopics of ${topicSeed.title}.`,
          questionCount: QUIZ_QUESTION_COUNTS.TOPIC_FINAL,
          levelId: level.id,
          categoryId: category.id,
          topicId: topic.id,
        });
        await attachQuestionsToQuiz(topicQuiz.id, topicBank);
        totals.quizzes += 1;
      }

      const categoryBank = uniqueSlice(
        categoryQuestionBank.get(category.id) ?? [],
        QUIZ_QUESTION_COUNTS.CATEGORY_FINAL,
      );
      const categoryQuiz = await upsertQuiz({
        id: stableId("quiz", `cat:${category.id}`),
        type: QuizType.CATEGORY_FINAL,
        title: `${level.code} ${meta.name} Test`,
        description: `Category final for ${level.code} ${meta.name}.`,
        questionCount: QUIZ_QUESTION_COUNTS.CATEGORY_FINAL,
        levelId: level.id,
        categoryId: category.id,
      });
      await attachQuestionsToQuiz(categoryQuiz.id, categoryBank);
      totals.quizzes += 1;
    }

    const levelBank = uniqueSlice(
      levelQuestionBank.get(level.id) ?? [],
      QUIZ_QUESTION_COUNTS.LEVEL_FINAL,
    );
    const levelQuiz = await upsertQuiz({
      id: stableId("quiz", `level:${level.id}`),
      type: QuizType.LEVEL_FINAL,
      title: `${level.code} Final Test`,
      description: `Final exam for the entire ${level.code} level.`,
      questionCount: QUIZ_QUESTION_COUNTS.LEVEL_FINAL,
      levelId: level.id,
    });
    await attachQuestionsToQuiz(levelQuiz.id, levelBank);
    totals.quizzes += 1;

    console.log(`✓ ${level.code} seeded`);
  }

  console.log("\n📊 Seed summary");
  console.table(totals);
  console.log("\n✅ Seed completed");
}

function uniqueSlice(ids: string[], count: number) {
  const unique = [...new Set(ids)];
  if (unique.length <= count) return unique;
  // deterministic spread across the bank
  const step = unique.length / count;
  const picked: string[] = [];
  for (let i = 0; i < count; i += 1) {
    picked.push(unique[Math.floor(i * step)]!);
  }
  return [...new Set(picked)].slice(0, count);
}

main()
  .catch((error) => {
    console.error("\n❌ Seed failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
