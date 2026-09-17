export type SeedDifficulty = "EASY" | "MEDIUM" | "HARD";

export type SeedQuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "CHOOSE_WORD"
  | "ARRANGE_WORDS"
  | "MATCH_WORDS"
  | "SENTENCE_CORRECTION";

export interface SeedQuestion {
  type: SeedQuestionType;
  prompt: string;
  options?: string[] | Record<string, string>;
  correctAnswer: string | string[] | Record<string, string>;
  explanation: string;
  difficulty?: SeedDifficulty;
  tags?: string[];
}

export interface SeedSubtopic {
  slug: string;
  title: string;
  description: string;
  /** When true, seed lesson + practice + 20 questions + subtopic quiz */
  withContent: boolean;
}

export interface SeedTopic {
  slug: string;
  title: string;
  description: string;
  difficulty: SeedDifficulty;
  subtopics: SeedSubtopic[];
}

export type SeedCategoryType =
  | "GRAMMAR"
  | "VOCABULARY"
  | "READING"
  | "LISTENING"
  | "WRITING"
  | "SPEAKING";

export interface SeedCategory {
  type: SeedCategoryType;
  topics: SeedTopic[];
}

export interface SeedLevel {
  code: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  categories: SeedCategory[];
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function defaultGrammarSubtopics(topicTitle: string): SeedSubtopic[] {
  return [
    {
      slug: "overview",
      title: `What is ${topicTitle}?`,
      description: `Core idea and when to use ${topicTitle}.`,
      withContent: true,
    },
    {
      slug: "positive",
      title: "Positive sentences",
      description: `Form affirmative sentences with ${topicTitle}.`,
      withContent: true,
    },
    {
      slug: "negative",
      title: "Negative sentences",
      description: `Form negative sentences with ${topicTitle}.`,
      withContent: true,
    },
    {
      slug: "questions",
      title: "Questions",
      description: `Ask questions using ${topicTitle}.`,
      withContent: true,
    },
    {
      slug: "key-forms",
      title: "Key forms and rules",
      description: `Important forms, spelling, and patterns for ${topicTitle}.`,
      withContent: true,
    },
    {
      slug: "usage",
      title: "Usage in context",
      description: `Real-life examples and frequency of ${topicTitle}.`,
      withContent: true,
    },
    {
      slug: "common-mistakes",
      title: "Common mistakes",
      description: `Typical learner errors with ${topicTitle}.`,
      withContent: true,
    },
    {
      slug: "review",
      title: "Review",
      description: `Quick review before the topic final test.`,
      withContent: true,
    },
  ];
}

export function lightSubtopics(topicTitle: string, count = 5): SeedSubtopic[] {
  const base = defaultGrammarSubtopics(topicTitle);
  return base.slice(0, count).map((item, index) => ({
    ...item,
    withContent: index < 3,
  }));
}
