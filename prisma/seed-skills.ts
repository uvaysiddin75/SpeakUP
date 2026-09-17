/**
 * Seed Vocabulary / Reading / Listening / Speaking skill content + quizzes.
 */
import {
  CefrCode,
  Difficulty,
  PrismaClient,
  QuestionType,
  QuizType,
  SpeakingExerciseType,
} from "@prisma/client";
import { createHash } from "crypto";
import { PASSING_SCORE } from "../src/lib/curriculum";
import {
  LISTENING_CATALOG,
  READING_CATALOG,
  SPEAKING_CATALOG,
  VOCABULARY_CATALOG,
  buildVocabularyQuestions,
  type Cefr,
  type SkillQuestion,
} from "../src/data/skills";

function stableId(prefix: string, key: string) {
  const hash = createHash("sha256").update(key).digest("hex").slice(0, 24);
  return `${prefix}_${hash}`;
}

function toJson(value: unknown) {
  return value as object;
}

function mapDifficulty(value: string): Difficulty {
  if (value === "HARD") return Difficulty.HARD;
  if (value === "MEDIUM") return Difficulty.MEDIUM;
  return Difficulty.EASY;
}

function mapQuestionType(type: SkillQuestion["type"]): QuestionType {
  return QuestionType[type];
}

function mapSpeakingType(type: string): SpeakingExerciseType {
  return SpeakingExerciseType[type as keyof typeof SpeakingExerciseType];
}

async function upsertSkillQuestions(
  prisma: PrismaClient,
  quizId: string,
  questions: SkillQuestion[],
  tag: string,
) {
  const questionIds: string[] = [];
  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i]!;
    const id = stableId("sq", `${quizId}:${i}:${q.prompt.slice(0, 40)}`);
    await prisma.question.upsert({
      where: { id },
      update: {
        type: mapQuestionType(q.type),
        prompt: q.prompt,
        options: q.options ? toJson(q.options) : undefined,
        correctAnswer: toJson(q.correctAnswer),
        explanation: q.explanation,
        difficulty: Difficulty.EASY,
        tags: [tag],
        isPublished: true,
      },
      create: {
        id,
        type: mapQuestionType(q.type),
        prompt: q.prompt,
        options: q.options ? toJson(q.options) : undefined,
        correctAnswer: toJson(q.correctAnswer),
        explanation: q.explanation,
        difficulty: Difficulty.EASY,
        tags: [tag],
        isPublished: true,
      },
    });
    questionIds.push(id);
  }

  await prisma.quizQuestion.deleteMany({ where: { quizId } });
  await prisma.quizQuestion.createMany({
    data: questionIds.map((questionId, order) => ({
      id: stableId("sqq", `${quizId}:${questionId}`),
      quizId,
      questionId,
      order,
    })),
  });

  return questionIds.length;
}

export async function seedSkillContent(prisma: PrismaClient) {
  const levels = Object.keys(VOCABULARY_CATALOG) as Cefr[];
  let vocabTopics = 0;
  let vocabWords = 0;
  let reading = 0;
  let listening = 0;
  let speaking = 0;
  let quizzes = 0;

  for (const level of levels) {
    const levelCode = level as CefrCode;

    for (const [order, topic] of VOCABULARY_CATALOG[level].entries()) {
      const topicId = stableId("vtop", `${level}:${topic.slug}`);
      await prisma.vocabularyTopic.upsert({
        where: { levelCode_slug: { levelCode, slug: topic.slug } },
        update: {
          title: topic.title,
          description: topic.description,
          difficulty: mapDifficulty(topic.difficulty),
          order: order + 1,
          isPublished: true,
        },
        create: {
          id: topicId,
          levelCode,
          slug: topic.slug,
          title: topic.title,
          description: topic.description,
          difficulty: mapDifficulty(topic.difficulty),
          order: order + 1,
          isPublished: true,
        },
      });
      vocabTopics += 1;

      const dbTopic = await prisma.vocabularyTopic.findUniqueOrThrow({
        where: { levelCode_slug: { levelCode, slug: topic.slug } },
      });

      await prisma.vocabularyWord.deleteMany({ where: { topicId: dbTopic.id } });
      for (const [wIndex, word] of topic.words.entries()) {
        await prisma.vocabularyWord.create({
          data: {
            id: stableId("vword", `${level}:${topic.slug}:${word.word}`),
            topicId: dbTopic.id,
            levelCode,
            categorySlug: topic.slug,
            word: word.word,
            translationRu: word.translationRu,
            translationUz: word.translationUz,
            pronunciation: word.pronunciation,
            example: word.example,
            partOfSpeech: word.partOfSpeech,
            description: word.description,
            difficulty: mapDifficulty(word.difficulty ?? topic.difficulty),
            order: wIndex + 1,
            isPublished: true,
            tags: [topic.slug, level],
          },
        });
        vocabWords += 1;
      }

      const quizId = stableId("vquiz", `${level}:${topic.slug}`);
      await prisma.quiz.upsert({
        where: { id: quizId },
        update: {
          title: `${topic.title} Vocabulary Test`,
          description: `At least 20 questions for ${level} ${topic.title}.`,
          questionCount: 20,
          passScore: PASSING_SCORE,
          type: QuizType.TOPIC_FINAL,
          isPublished: true,
          vocabularyTopicId: dbTopic.id,
        },
        create: {
          id: quizId,
          title: `${topic.title} Vocabulary Test`,
          description: `At least 20 questions for ${level} ${topic.title}.`,
          questionCount: 20,
          passScore: PASSING_SCORE,
          type: QuizType.TOPIC_FINAL,
          isPublished: true,
          vocabularyTopicId: dbTopic.id,
        },
      });
      const questions = buildVocabularyQuestions(topic);
      await upsertSkillQuestions(
        prisma,
        quizId,
        questions.slice(0, Math.max(20, questions.length)),
        `vocab:${level}:${topic.slug}`,
      );
      quizzes += 1;
    }

    for (const [order, lesson] of READING_CATALOG[level].entries()) {
      const id = stableId("read", `${level}:${lesson.slug}`);
      await prisma.readingQuestion.deleteMany({
        where: { reading: { levelCode, slug: lesson.slug } },
      });
      await prisma.readingText.upsert({
        where: { levelCode_slug: { levelCode, slug: lesson.slug } },
        update: {
          title: lesson.title,
          description: lesson.description,
          text: lesson.text,
          vocabulary: toJson(lesson.vocabulary),
          importantWords: toJson(lesson.importantWords),
          difficulty: mapDifficulty(lesson.difficulty),
          order: order + 1,
          isPublished: true,
        },
        create: {
          id,
          levelCode,
          slug: lesson.slug,
          title: lesson.title,
          description: lesson.description,
          text: lesson.text,
          vocabulary: toJson(lesson.vocabulary),
          importantWords: toJson(lesson.importantWords),
          difficulty: mapDifficulty(lesson.difficulty),
          order: order + 1,
          isPublished: true,
        },
      });
      const db = await prisma.readingText.findUniqueOrThrow({
        where: { levelCode_slug: { levelCode, slug: lesson.slug } },
      });
      await prisma.readingQuestion.createMany({
        data: lesson.questions.map((q, i) => ({
          id: stableId("rq", `${db.id}:${i}`),
          readingId: db.id,
          type: mapQuestionType(q.type),
          prompt: q.prompt,
          options: q.options ? toJson(q.options) : undefined,
          correctAnswer: toJson(q.correctAnswer),
          explanation: q.explanation,
          order: i + 1,
        })),
      });
      const quizId = stableId("rquiz", `${level}:${lesson.slug}`);
      await prisma.quiz.upsert({
        where: { id: quizId },
        update: {
          title: `${lesson.title} Reading Test`,
          questionCount: Math.min(20, Math.max(10, lesson.questions.length)),
          passScore: PASSING_SCORE,
          type: QuizType.TOPIC_FINAL,
          isPublished: true,
          readingTextId: db.id,
        },
        create: {
          id: quizId,
          title: `${lesson.title} Reading Test`,
          description: `Reading comprehension for ${lesson.title}`,
          questionCount: Math.min(20, Math.max(10, lesson.questions.length)),
          passScore: PASSING_SCORE,
          type: QuizType.TOPIC_FINAL,
          isPublished: true,
          readingTextId: db.id,
        },
      });
      await upsertSkillQuestions(
        prisma,
        quizId,
        lesson.questions,
        `reading:${level}:${lesson.slug}`,
      );
      reading += 1;
      quizzes += 1;
    }

    for (const [order, lesson] of LISTENING_CATALOG[level].entries()) {
      await prisma.listeningQuestion.deleteMany({
        where: { listening: { levelCode, slug: lesson.slug } },
      });
      const id = stableId("listen", `${level}:${lesson.slug}`);
      await prisma.listeningTask.upsert({
        where: { levelCode_slug: { levelCode, slug: lesson.slug } },
        update: {
          title: lesson.title,
          description: lesson.description,
          transcript: lesson.transcript,
          vocabulary: toJson(lesson.vocabulary),
          difficulty: mapDifficulty(lesson.difficulty),
          order: order + 1,
          durationSec: lesson.durationSec,
          audioUrl: null,
          isPublished: true,
        },
        create: {
          id,
          levelCode,
          slug: lesson.slug,
          title: lesson.title,
          description: lesson.description,
          transcript: lesson.transcript,
          vocabulary: toJson(lesson.vocabulary),
          difficulty: mapDifficulty(lesson.difficulty),
          order: order + 1,
          durationSec: lesson.durationSec,
          audioUrl: null,
          isPublished: true,
        },
      });
      const db = await prisma.listeningTask.findUniqueOrThrow({
        where: { levelCode_slug: { levelCode, slug: lesson.slug } },
      });
      await prisma.listeningQuestion.createMany({
        data: lesson.questions.map((q, i) => ({
          id: stableId("lq", `${db.id}:${i}`),
          listeningId: db.id,
          type: mapQuestionType(q.type),
          prompt: q.prompt,
          options: q.options ? toJson(q.options) : undefined,
          correctAnswer: toJson(q.correctAnswer),
          explanation: q.explanation,
          order: i + 1,
        })),
      });
      const quizId = stableId("lquiz", `${level}:${lesson.slug}`);
      await prisma.quiz.upsert({
        where: { id: quizId },
        update: {
          title: `${lesson.title} Listening Test`,
          questionCount: Math.min(20, Math.max(10, lesson.questions.length)),
          passScore: PASSING_SCORE,
          type: QuizType.TOPIC_FINAL,
          isPublished: true,
          listeningTaskId: db.id,
        },
        create: {
          id: quizId,
          title: `${lesson.title} Listening Test`,
          description: `Listening test for ${lesson.title}`,
          questionCount: Math.min(20, Math.max(10, lesson.questions.length)),
          passScore: PASSING_SCORE,
          type: QuizType.TOPIC_FINAL,
          isPublished: true,
          listeningTaskId: db.id,
        },
      });
      await upsertSkillQuestions(
        prisma,
        quizId,
        lesson.questions,
        `listening:${level}:${lesson.slug}`,
      );
      listening += 1;
      quizzes += 1;
    }

    for (const [order, lesson] of SPEAKING_CATALOG[level].entries()) {
      await prisma.speakingTask.upsert({
        where: { levelCode_slug: { levelCode, slug: lesson.slug } },
        update: {
          title: lesson.title,
          prompt: lesson.prompt,
          instructions: lesson.instructions,
          usefulVocabulary: toJson(lesson.usefulVocabulary),
          usefulPhrases: toJson(lesson.usefulPhrases),
          exampleAnswer: lesson.exampleAnswer,
          exerciseType: mapSpeakingType(lesson.exerciseType),
          timerSec: lesson.timerSec,
          tips: lesson.tips,
          difficulty: mapDifficulty(lesson.difficulty),
          order: order + 1,
          isPublished: true,
        },
        create: {
          id: stableId("speak", `${level}:${lesson.slug}`),
          levelCode,
          slug: lesson.slug,
          title: lesson.title,
          prompt: lesson.prompt,
          instructions: lesson.instructions,
          usefulVocabulary: toJson(lesson.usefulVocabulary),
          usefulPhrases: toJson(lesson.usefulPhrases),
          exampleAnswer: lesson.exampleAnswer,
          exerciseType: mapSpeakingType(lesson.exerciseType),
          timerSec: lesson.timerSec,
          tips: lesson.tips,
          difficulty: mapDifficulty(lesson.difficulty),
          order: order + 1,
          isPublished: true,
        },
      });
      speaking += 1;
    }
  }

  return { vocabTopics, vocabWords, reading, listening, speaking, quizzes };
}
