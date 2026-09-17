import type { SkillQuestion, VocabWordSeed } from "./types";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Simple string hash → positive 32-bit seed */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

export function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function uniqueOptions(
  correct: string,
  distractors: string[],
  rng: () => number,
  count = 4
): string[] {
  const pool = distractors.filter(
    (d) => d.toLowerCase() !== correct.toLowerCase()
  );
  const chosen = shuffle(pool, rng).slice(0, Math.max(0, count - 1));
  return shuffle([correct, ...chosen], rng);
}

export function mcq(
  prompt: string,
  correct: string,
  distractors: string[],
  explanation: string,
  rng: () => number
): SkillQuestion {
  return {
    type: "MULTIPLE_CHOICE",
    prompt,
    options: uniqueOptions(correct, distractors, rng, 4),
    correctAnswer: correct,
    explanation,
  };
}

export function chooseWord(
  prompt: string,
  correct: string,
  distractors: string[],
  explanation: string,
  rng: () => number
): SkillQuestion {
  return {
    type: "CHOOSE_WORD",
    prompt,
    options: uniqueOptions(correct, distractors, rng, 4),
    correctAnswer: correct,
    explanation,
  };
}

export function trueFalse(
  prompt: string,
  correct: boolean,
  explanation: string
): SkillQuestion {
  return {
    type: "TRUE_FALSE",
    prompt,
    options: ["True", "False"],
    correctAnswer: correct,
    explanation,
  };
}

export function fillBlank(
  prompt: string,
  correct: string,
  explanation: string,
  options?: string[]
): SkillQuestion {
  return {
    type: "FILL_BLANK",
    prompt,
    ...(options ? { options } : {}),
    correctAnswer: correct,
    explanation,
  };
}

export function blankExample(example: string, word: string): string {
  const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, "i");
  if (re.test(example)) {
    return example.replace(re, "_____");
  }
  return example.replace(word, "_____");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build a large mixed question set from vocabulary words (20+ unique). */
export function buildQuestionsFromWords(
  words: VocabWordSeed[],
  seedKey: string
): SkillQuestion[] {
  const rng = mulberry32(hashSeed(seedKey));
  const questions: SkillQuestion[] = [];
  const seen = new Set<string>();

  const push = (q: SkillQuestion) => {
    const key = `${q.type}|${q.prompt}|${String(q.correctAnswer)}`;
    if (seen.has(key)) return;
    seen.add(key);
    questions.push(q);
  };

  const allWords = words.map((w) => w.word);
  const allRu = words.map((w) => w.translationRu);
  const allUz = words.map((w) => w.translationUz);

  for (const w of words) {
    const otherWords = allWords.filter((x) => x !== w.word);
    const otherRu = allRu.filter((x) => x !== w.translationRu);
    const otherUz = allUz.filter((x) => x !== w.translationUz);

    push(
      mcq(
        `What is the Russian meaning of "${w.word}"?`,
        w.translationRu,
        otherRu,
        `"${w.word}" means "${w.translationRu}".`,
        rng
      )
    );

    push(
      mcq(
        `Which English word means "${w.translationRu}"?`,
        w.word,
        otherWords,
        `"${w.translationRu}" = "${w.word}".`,
        rng
      )
    );

    push(
      chooseWord(
        `Choose the correct word: ${blankExample(w.example, w.word)}`,
        w.word,
        otherWords,
        `The sentence uses "${w.word}". Example: ${w.example}`,
        rng
      )
    );

    push(
      fillBlank(
        `Fill in the blank: ${blankExample(w.example, w.word)}`,
        w.word,
        `Correct word: "${w.word}". ${w.example}`
      )
    );

    push(
      trueFalse(
        `"${w.word}" means "${w.translationRu}".`,
        true,
        `True — "${w.word}" = "${w.translationRu}".`
      )
    );

    const wrongRu = pick(otherRu.length ? otherRu : ["неизвестно"], rng);
    push(
      trueFalse(
        `"${w.word}" means "${wrongRu}".`,
        false,
        `False — "${w.word}" means "${w.translationRu}", not "${wrongRu}".`
      )
    );

    push(
      mcq(
        `Choose the best example sentence for "${w.word}".`,
        w.example,
        words
          .filter((x) => x.word !== w.word)
          .map((x) => x.example)
          .slice(0, 6),
        `Correct example: ${w.example}`,
        rng
      )
    );

    push(
      mcq(
        `What is the Uzbek meaning of "${w.word}"?`,
        w.translationUz,
        otherUz,
        `"${w.word}" means "${w.translationUz}" in Uzbek.`,
        rng
      )
    );

    push(
      chooseWord(
        `Complete: The ${w.partOfSpeech} form is "_____". (hint: ${w.translationRu})`,
        w.word,
        otherWords,
        `"${w.word}" is a ${w.partOfSpeech}.`,
        rng
      )
    );

    push(
      fillBlank(
        `Sentence completion: ${blankExample(w.example, w.word)} (${w.partOfSpeech})`,
        w.word,
        `Use "${w.word}". Pronunciation: /${w.pronunciation}/`
      )
    );
  }

  // Extra mix to guarantee 20+ even for smaller topics
  while (questions.length < 20 && words.length > 0) {
    const w = pick(words, rng);
    const other = allWords.filter((x) => x !== w.word);
    push(
      mcq(
        `Quick check: "${w.word}" pronunciation is closest to which spelling cue?`,
        w.pronunciation,
        words.filter((x) => x.word !== w.word).map((x) => x.pronunciation),
        `/${w.pronunciation}/`,
        rng
      )
    );
    push(
      chooseWord(
        `Pick the word: ${w.translationRu} / ${w.translationUz}`,
        w.word,
        other,
        `"${w.word}"`,
        rng
      )
    );
    if (questions.length >= 20) break;
    // safety against infinite loop on tiny pools
    if (seen.size > questions.length + 5) break;
  }

  return questions.slice(0, Math.max(20, Math.min(questions.length, 40)));
}

export function estimateDurationSec(transcript: string, wpm = 130): number {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(30, Math.round((words / wpm) * 60));
}
