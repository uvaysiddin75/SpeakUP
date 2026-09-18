export type CefrLevelCode = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type CategoryType =
  | "GRAMMAR"
  | "VOCABULARY"
  | "READING"
  | "LISTENING"
  | "WRITING"
  | "SPEAKING";

export type ProgressStatus =
  | "LOCKED"
  | "AVAILABLE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "MASTERED";

export type TopicStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

/** @deprecated Use ProgressStatus for subtopics; TopicStatus for topics */
export type LegacyTopicStatus = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";

export type UserRole = "USER" | "ADMIN";

export type QuizType =
  | "SUBTOPIC"
  | "TOPIC_FINAL"
  | "CATEGORY_FINAL"
  | "LEVEL_FINAL";

export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "CHOOSE_WORD"
  | "ARRANGE_WORDS"
  | "MATCH_WORDS"
  | "SENTENCE_CORRECTION";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface QuizAttemptResult {
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  percentage: number;
  timeSpentSec: number;
  passed: boolean;
  completedAt: Date;
  levelId?: string | null;
  categoryId?: string | null;
  topicId?: string | null;
  subtopicId?: string | null;
  userId: string;
}
