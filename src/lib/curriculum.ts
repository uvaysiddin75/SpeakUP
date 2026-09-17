/**
 * Curriculum hierarchy constants and helpers for SpeakUp.
 * Level → Category → Topic → Subtopic → Lesson / Practice / Quiz
 */

export const PASSING_SCORE = 70;

export const QUIZ_QUESTION_COUNTS = {
  SUBTOPIC: 20,
  TOPIC_FINAL: 20,
  CATEGORY_FINAL: 25,
  LEVEL_FINAL: 40,
} as const;

export const CATEGORY_TYPES = [
  "GRAMMAR",
  "VOCABULARY",
  "READING",
  "LISTENING",
  "WRITING",
  "SPEAKING",
] as const;

export type CategoryTypeValue = (typeof CATEGORY_TYPES)[number];

export const CATEGORY_META: Record<
  CategoryTypeValue,
  { slug: string; name: string; description: string }
> = {
  GRAMMAR: {
    slug: "grammar",
    name: "Grammar",
    description: "Rules, structures, and accuracy practice.",
  },
  VOCABULARY: {
    slug: "vocabulary",
    name: "Vocabulary",
    description: "Words, phrases, and flashcard practice.",
  },
  READING: {
    slug: "reading",
    name: "Reading",
    description: "Texts with comprehension questions.",
  },
  LISTENING: {
    slug: "listening",
    name: "Listening",
    description: "Audio tasks with transcripts and quizzes.",
  },
  WRITING: {
    slug: "writing",
    name: "Writing",
    description: "Guided writing prompts and submissions.",
  },
  SPEAKING: {
    slug: "speaking",
    name: "Speaking",
    description: "Speaking prompts with audio recording.",
  },
};

export const LEVEL_META = [
  {
    code: "A1" as const,
    slug: "a1",
    name: "Beginner",
    description:
      "Start with basics: greetings, simple sentences, and everyday words.",
    order: 1,
  },
  {
    code: "A2" as const,
    slug: "a2",
    name: "Elementary",
    description:
      "Build everyday communication for travel, shopping, and routines.",
    order: 2,
  },
  {
    code: "B1" as const,
    slug: "b1",
    name: "Intermediate",
    description:
      "Express opinions, describe experiences, and handle most situations.",
    order: 3,
  },
  {
    code: "B2" as const,
    slug: "b2",
    name: "Upper-Intermediate",
    description:
      "Discuss abstract topics and communicate fluently with native speakers.",
    order: 4,
  },
  {
    code: "C1" as const,
    slug: "c1",
    name: "Advanced",
    description:
      "Use complex language flexibly for academic and professional goals.",
    order: 5,
  },
  {
    code: "C2" as const,
    slug: "c2",
    name: "Proficiency",
    description:
      "Near-native mastery with precision, nuance, and stylistic control.",
    order: 6,
  },
] as const;

export function getQuizHref(
  quizId: string | null,
  fallbackPath: string,
): string {
  return quizId ? `/quiz/${quizId}` : fallbackPath;
}
