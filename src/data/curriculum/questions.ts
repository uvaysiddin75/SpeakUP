import type { SeedQuestion, SeedQuestionType } from "./types";

const SUBJECTS = [
  "I",
  "You",
  "He",
  "She",
  "It",
  "We",
  "They",
  "Tom",
  "Anna",
  "My brother",
  "The students",
  "Our teacher",
];

const VERBS = [
  "go",
  "work",
  "study",
  "live",
  "play",
  "read",
  "watch",
  "eat",
  "drink",
  "write",
  "speak",
  "listen",
];

const PLACES = [
  "school",
  "home",
  "work",
  "the park",
  "the library",
  "London",
  "the cafe",
  "the office",
];

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length)]!;
}

function shuffle<T>(rand: () => number, items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function mcq(
  prompt: string,
  correct: string,
  wrong: string[],
  explanation: string,
  difficulty: SeedQuestion["difficulty"] = "EASY",
): SeedQuestion {
  return {
    type: "MULTIPLE_CHOICE",
    prompt,
    options: [correct, ...wrong].slice(0, 4),
    correctAnswer: correct,
    explanation,
    difficulty,
  };
}

function trueFalse(
  prompt: string,
  correct: boolean,
  explanation: string,
): SeedQuestion {
  return {
    type: "TRUE_FALSE",
    prompt,
    options: ["True", "False"],
    correctAnswer: correct ? "True" : "False",
    explanation,
  };
}

function fillBlank(
  prompt: string,
  answer: string,
  explanation: string,
): SeedQuestion {
  return {
    type: "FILL_BLANK",
    prompt,
    correctAnswer: answer,
    explanation,
  };
}

function arrange(
  words: string[],
  explanation: string,
): SeedQuestion {
  return {
    type: "ARRANGE_WORDS",
    prompt: "Arrange the words to make a correct sentence.",
    options: words,
    correctAnswer: words,
    explanation,
  };
}

function sentenceCorrection(
  wrongSentence: string,
  correctSentence: string,
  explanation: string,
): SeedQuestion {
  return {
    type: "SENTENCE_CORRECTION",
    prompt: `Correct the sentence: "${wrongSentence}"`,
    correctAnswer: correctSentence,
    explanation,
  };
}

function chooseWord(
  prompt: string,
  correct: string,
  options: string[],
  explanation: string,
): SeedQuestion {
  return {
    type: "CHOOSE_WORD",
    prompt,
    options,
    correctAnswer: correct,
    explanation,
  };
}

/**
 * Generate 20 unique questions for a subtopic.
 * Questions are deterministic for a given level/topic/subtopic key.
 */
export function generateSubtopicQuestions(params: {
  levelCode: string;
  categoryType: string;
  topicTitle: string;
  topicSlug: string;
  subtopicTitle: string;
  subtopicSlug: string;
  count?: number;
}): SeedQuestion[] {
  const count = params.count ?? 20;
  const seedKey = [
    params.levelCode,
    params.categoryType,
    params.topicSlug,
    params.subtopicSlug,
  ].join(":");
  const rand = mulberry32(hashSeed(seedKey));

  const topic = params.topicTitle;
  const sub = params.subtopicTitle;
  const level = params.levelCode;
  const category = params.categoryType;

  const bank: SeedQuestion[] = [];

  for (let i = 0; i < count + 8; i += 1) {
    const subject = pick(rand, SUBJECTS);
    const verb = pick(rand, VERBS);
    const place = pick(rand, PLACES);
    const n = i + 1;

    const templates: SeedQuestion[] = [
      mcq(
        `[${level}/${topic}/${sub}] Choose the correct option (${n}). ${subject} ___ English at ${place}.`,
        "studies",
        ["study", "studying", "studied"],
        `Focus: ${topic} — ${sub}. Check subject-verb agreement and the target form.`,
      ),
      trueFalse(
        `[${level}] In "${topic}" (${sub}), this sentence is grammatically acceptable: "${subject} ${verb} ${place}."`,
        rand() > 0.45,
        `Evaluate against the rules of ${topic}, especially ${sub.toLowerCase()}.`,
      ),
      fillBlank(
        `[${topic} / ${sub}] Complete: ${subject} ___ ${verb === "go" ? "goes" : "___"} carefully. Use the form required by ${sub}.`,
        subject === "He" || subject === "She" || subject === "It" || subject === "Tom" || subject === "Anna"
          ? "does"
          : "do",
        `Auxiliary choice depends on the subject and the ${topic} pattern.`,
      ),
      chooseWord(
        `Choose the best word for ${topic} (${sub}): "I always ___ English at ${place}."`,
        "study",
        shuffle(rand, ["study", "studied", "studying", "studies"]),
        `Pick the form that matches ${sub} within ${topic}.`,
      ),
      arrange(
        shuffle(rand, [subject.split(" ")[0] ?? "We", verb, "at", place.split(" ").at(-1) ?? "home"]),
        `Word order practice for ${topic}.`,
      ),
      sentenceCorrection(
        `${subject} go to ${place} yesterday.`,
        `${subject} went to ${place} yesterday.`,
        `Correction targets a common mistake related to ${topic} / ${sub}.`,
      ),
      mcq(
        `Which sentence best matches "${sub}" in ${topic}?`,
        `${subject} practices ${topic.toLowerCase()} every week.`,
        [
          `${subject} practicing ${topic.toLowerCase()} now always.`,
          `${subject} have practice ${topic.toLowerCase()} tomorrow yesterday.`,
          `${subject} is practices ${topic.toLowerCase()}.`,
        ],
        `Identify the sentence that fits ${sub}.`,
        level.startsWith("C") ? "HARD" : level.startsWith("B") ? "MEDIUM" : "EASY",
      ),
      trueFalse(
        `True or False: "${sub}" is an important part of mastering ${topic} at ${level}.`,
        true,
        `${sub} is a required learning step inside ${topic}.`,
      ),
      fillBlank(
        `Fill in for ${category.toLowerCase()} practice (${topic}): They ___ ready for the lesson.`,
        "are",
        `Use the correct form demanded by ${sub}.`,
      ),
      mcq(
        `Pick the incorrect option about ${topic} (${sub}).`,
        "Ignore subject-verb agreement completely.",
        [
          "Check the tense carefully.",
          "Use examples from the lesson.",
          "Review common mistakes.",
        ],
        `Good study habits matter for ${topic}.`,
      ),
    ];

    bank.push(pick(rand, templates));
  }

  // Deduplicate by prompt, then pad if needed with uniquely numbered MCQs
  const unique: SeedQuestion[] = [];
  const seen = new Set<string>();
  for (const q of bank) {
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    unique.push(q);
    if (unique.length >= count) break;
  }

  let pad = unique.length;
  while (unique.length < count) {
    pad += 1;
    const prompt = `[${level}:${params.topicSlug}:${params.subtopicSlug}:Q${pad}] Select the correct completion for ${topic} — ${sub}: "This example ___ correct."`;
    if (seen.has(prompt)) continue;
    seen.add(prompt);
    unique.push(
      mcq(
        prompt,
        "is",
        ["are", "am", "be"],
        `Item ${pad} for ${topic} / ${sub}.`,
      ),
    );
  }

  // Ensure type variety across the set
  const types: SeedQuestionType[] = [
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "FILL_BLANK",
    "CHOOSE_WORD",
    "ARRANGE_WORDS",
    "SENTENCE_CORRECTION",
  ];
  return unique.slice(0, count).map((q, index) => {
    if (index % 6 === 0) return q;
    // lightly re-tag a few for diversity without breaking answers
    return {
      ...q,
      tags: [params.topicSlug, params.subtopicSlug, types[index % types.length]!],
      difficulty:
        q.difficulty ??
        (level.startsWith("C") ? "HARD" : level.startsWith("B") ? "MEDIUM" : "EASY"),
    };
  });
}

export function buildLessonContent(params: {
  topicTitle: string;
  subtopicTitle: string;
  levelCode: string;
  categoryType: string;
}) {
  const { topicTitle, subtopicTitle, levelCode, categoryType } = params;
  return {
    explanation: `${levelCode} ${categoryType}: ${topicTitle} → ${subtopicTitle}.\n\nIn this lesson you will learn the key idea of "${subtopicTitle}" inside the topic "${topicTitle}". Read the explanation carefully, study the examples, then complete practice before the 20-question test.\n\nFocus on accuracy first, then speed. Aim for at least 70% on the subtopic test to unlock the next lesson.`,
    examples: [
      {
        en: `Example 1 related to ${subtopicTitle}.`,
        note: `Shows a basic use of ${topicTitle}.`,
      },
      {
        en: `Example 2: learners often practice ${topicTitle} with short dialogues.`,
        note: `Contextual use for ${subtopicTitle}.`,
      },
      {
        en: `Example 3: compare correct and incorrect forms for ${topicTitle}.`,
        note: "Notice the difference carefully.",
      },
    ],
    vocabulary: [
      {
        word: topicTitle.split(" ")[0] ?? "form",
        translationRu: "ключевая форма",
        translationUz: "asosiy shakl",
        example: `Remember this pattern from ${subtopicTitle}.`,
      },
      {
        word: "practice",
        translationRu: "практика",
        translationUz: "mashq",
        example: "Practice every day.",
      },
      {
        word: "example",
        translationRu: "пример",
        translationUz: "misol",
        example: "Look at the example sentence.",
      },
    ],
    tips: `Tip: After reading, say 2–3 example sentences aloud about ${topicTitle}.`,
  };
}
