export type {
  Cefr,
  SkillDifficulty,
  SkillQuestion,
  VocabWordSeed,
  VocabTopicSeed,
  ReadingLessonSeed,
  ListeningLessonSeed,
  SpeakingLessonSeed,
} from "./types";

export {
  slugify,
  buildQuestionsFromWords,
  estimateDurationSec,
  mcq,
  trueFalse,
  fillBlank,
  chooseWord,
} from "./helpers";

export {
  VOCABULARY_CATALOG,
  buildVocabularyQuestions,
} from "./vocabulary-catalog";

export { HIGHER_VOCAB } from "./higher-vocab";

export {
  READING_CATALOG,
  LISTENING_CATALOG,
  SPEAKING_CATALOG,
} from "./skill-lessons";

// Approximate catalog sizes (topics/lessons):
// Vocabulary: A1 20, A2 16, B1 14, B2 12, C1 10, C2 8
// Reading: A1–B2 8 each, C1–C2 6 each
// Listening: A1–B2 8 each, C1–C2 6 each
// Speaking: A1–B2 10 each, C1–C2 8 each
