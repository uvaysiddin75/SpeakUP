/**
 * Guest (local) progress until full auth is wired.
 * Persists in localStorage under a stable key.
 */

export type SkillKind = "vocabulary" | "reading" | "listening" | "speaking";

export type GuestSkillProgress = {
  completedIds: string[];
  bestScores: Record<string, number>;
  attempts: Record<string, number>;
  timeSpentSec: Record<string, number>;
  wordsLearned?: Record<string, string[]>; // topicId -> wordIds
  speakingScores?: Record<
    string,
    {
      pronunciation: number;
      fluency: number;
      grammar: number;
      vocabulary: number;
      confidence: number;
      total: number;
    }
  >;
};

export type GuestProgressStore = {
  version: 1;
  skills: Record<SkillKind, GuestSkillProgress>;
};

const STORAGE_KEY = "speakup_guest_progress_v1";

function emptySkill(): GuestSkillProgress {
  return {
    completedIds: [],
    bestScores: {},
    attempts: {},
    timeSpentSec: {},
    wordsLearned: {},
    speakingScores: {},
  };
}

export function emptyGuestProgress(): GuestProgressStore {
  return {
    version: 1,
    skills: {
      vocabulary: emptySkill(),
      reading: emptySkill(),
      listening: emptySkill(),
      speaking: emptySkill(),
    },
  };
}

export function readGuestProgress(): GuestProgressStore {
  if (typeof window === "undefined") return emptyGuestProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyGuestProgress();
    const parsed = JSON.parse(raw) as GuestProgressStore;
    if (parsed?.version !== 1 || !parsed.skills) return emptyGuestProgress();
    return parsed;
  } catch {
    return emptyGuestProgress();
  }
}

export function writeGuestProgress(store: GuestProgressStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function skillPercent(skill: GuestSkillProgress, totalItems: number): number {
  if (totalItems <= 0) return 0;
  return Math.round((skill.completedIds.length / totalItems) * 1000) / 10;
}

export function markLessonComplete(
  kind: SkillKind,
  id: string,
  score?: number,
  timeSpentSec?: number,
) {
  const store = readGuestProgress();
  const skill = store.skills[kind];
  if (!skill.completedIds.includes(id)) {
    skill.completedIds.push(id);
  }
  skill.attempts[id] = (skill.attempts[id] ?? 0) + 1;
  if (typeof score === "number") {
    skill.bestScores[id] = Math.max(skill.bestScores[id] ?? 0, score);
  }
  if (typeof timeSpentSec === "number") {
    skill.timeSpentSec[id] = (skill.timeSpentSec[id] ?? 0) + timeSpentSec;
  }
  writeGuestProgress(store);
  return store;
}

export function markWordLearned(topicId: string, wordId: string) {
  const store = readGuestProgress();
  const skill = store.skills.vocabulary;
  const list = skill.wordsLearned?.[topicId] ?? [];
  if (!list.includes(wordId)) list.push(wordId);
  skill.wordsLearned = { ...(skill.wordsLearned ?? {}), [topicId]: list };
  writeGuestProgress(store);
  return store;
}

export function saveSpeakingSelfEval(
  taskId: string,
  scores: {
    pronunciation: number;
    fluency: number;
    grammar: number;
    vocabulary: number;
    confidence: number;
  },
) {
  const total =
    Math.round(
      ((scores.pronunciation +
        scores.fluency +
        scores.grammar +
        scores.vocabulary +
        scores.confidence) /
        5) *
        20 *
        10,
    ) / 10;
  const store = markLessonComplete("speaking", taskId, total);
  store.skills.speaking.speakingScores = {
    ...(store.skills.speaking.speakingScores ?? {}),
    [taskId]: { ...scores, total },
  };
  writeGuestProgress(store);
  return { total, store };
}
