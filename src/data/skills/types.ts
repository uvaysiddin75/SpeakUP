export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type SkillDifficulty = "EASY" | "MEDIUM" | "HARD";

export type SkillQuestion = {
  type:
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE"
    | "FILL_BLANK"
    | "CHOOSE_WORD"
    | "MATCH_WORDS"
    | "SENTENCE_CORRECTION";
  prompt: string;
  options?: string[];
  correctAnswer: string | string[] | boolean;
  explanation: string;
};

export type VocabWordSeed = {
  word: string;
  translationRu: string;
  translationUz: string;
  pronunciation: string;
  example: string;
  partOfSpeech: string;
  description?: string;
  difficulty?: SkillDifficulty;
};

export type VocabTopicSeed = {
  slug: string;
  title: string;
  description: string;
  difficulty: SkillDifficulty;
  words: VocabWordSeed[];
};

export type ReadingLessonSeed = {
  slug: string;
  title: string;
  description: string;
  text: string;
  vocabulary: Array<{ word: string; meaning: string }>;
  importantWords: string[];
  difficulty: SkillDifficulty;
  questions: SkillQuestion[]; // min 10-12, prefer 12-15
};

export type ListeningLessonSeed = {
  slug: string;
  title: string;
  description: string;
  transcript: string;
  vocabulary: Array<{ word: string; meaning: string }>;
  difficulty: SkillDifficulty;
  durationSec: number;
  questions: SkillQuestion[]; // min 10
};

export type SpeakingLessonSeed = {
  slug: string;
  title: string;
  prompt: string;
  instructions: string;
  usefulVocabulary: string[];
  usefulPhrases: string[];
  exampleAnswer: string;
  exerciseType:
    | "READ_ALOUD"
    | "REPEAT_AFTER"
    | "ANSWER_QUESTION"
    | "DESCRIBE_PICTURE"
    | "TALK_TOPIC"
    | "GIVE_OPINION"
    | "ROLE_PLAY"
    | "DEBATE";
  timerSec: number;
  tips?: string;
  difficulty: SkillDifficulty;
};
