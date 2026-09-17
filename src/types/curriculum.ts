import type { CategoryType, CefrLevelCode, Difficulty, ProgressStatus } from "@/types";

export interface CurriculumSubtopic {
  slug: string;
  title: string;
  description: string;
  order: number;
  status: ProgressStatus;
  quizId: string | null;
}

export interface CurriculumTopic {
  slug: string;
  title: string;
  description: string;
  order: number;
  difficulty: Difficulty;
  subtopics: CurriculumSubtopic[];
  topicFinalQuizId: string | null;
}

export interface CurriculumCategory {
  type: CategoryType;
  slug: string;
  name: string;
  description: string;
  order: number;
  topics: CurriculumTopic[];
}

export interface CurriculumLevelTree {
  code: CefrLevelCode;
  slug: string;
  name: string;
  description: string;
  order: number;
  categories: CurriculumCategory[];
  progressPercent: number;
  totalSubtopics: number;
  completedSubtopics: number;
}

export interface LessonExample {
  en: string;
  note?: string;
}

export interface LessonVocabularyItem {
  word: string;
  translationRu?: string;
  translationUz?: string;
  example?: string;
}

export interface SubtopicLesson {
  explanation: string;
  examples: LessonExample[];
  vocabulary: LessonVocabularyItem[] | null;
  tips: string | null;
  estimatedMin: number;
  practiceId: string | null;
}

export interface SubtopicDetail extends CurriculumSubtopic {
  levelSlug: string;
  levelCode: CefrLevelCode;
  categorySlug: string;
  categoryName: string;
  categoryType: CategoryType;
  topicSlug: string;
  topicTitle: string;
  lesson: SubtopicLesson;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
