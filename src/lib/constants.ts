import { LEVEL_META } from "@/lib/curriculum";

export const APP_NAME = "SpeakUp";
export const APP_SLOGAN = "Learn English. Speak with Confidence.";
export const APP_DESCRIPTION =
  "Improve your English with interactive lessons, quizzes, vocabulary practice and personalized progress.";

/** Prefer LEVEL_META from @/lib/curriculum — kept for existing UI */
export const CEFR_LEVELS = LEVEL_META.map((level) => ({
  code: level.code,
  slug: level.slug,
  name: level.name,
  description: level.description,
  topicsCount: 0,
}));

export const FEATURES = [
  {
    key: "grammar",
    title: "Grammar",
    description: "Master English grammar.",
    href: "/grammar",
  },
  {
    key: "vocabulary",
    title: "Vocabulary",
    description: "Build a strong vocabulary.",
    href: "/vocabulary",
  },
  {
    key: "reading",
    title: "Reading",
    description: "Improve reading comprehension.",
    href: "/reading",
  },
  {
    key: "listening",
    title: "Listening",
    description: "Train your listening skills.",
    href: "/listening",
  },
  {
    key: "writing",
    title: "Writing",
    description: "Practice writing.",
    href: "/writing",
  },
  {
    key: "speaking",
    title: "Speaking",
    description: "Build confidence in speaking.",
    href: "/speaking",
  },
] as const;

export const MARKETING_NAV = [
  { href: "/", key: "home" },
  { href: "/courses", key: "courses" },
  { href: "/grammar", key: "grammar" },
  { href: "/vocabulary", key: "vocabulary" },
  { href: "/reading", key: "reading" },
  { href: "/listening", key: "listening" },
  { href: "/speaking", key: "speaking" },
] as const;

export const APP_NAV = [
  { href: "/dashboard", key: "dashboard", icon: "LayoutDashboard" },
  { href: "/courses", key: "courses", icon: "BookOpen" },
  { href: "/grammar", key: "grammar", icon: "PencilRuler" },
  { href: "/vocabulary", key: "vocabulary", icon: "Languages" },
  { href: "/reading", key: "reading", icon: "BookMarked" },
  { href: "/listening", key: "listening", icon: "Headphones" },
  { href: "/writing", key: "writing", icon: "PenLine" },
  { href: "/speaking", key: "speaking", icon: "Mic" },
  { href: "/tests", key: "tests", icon: "ClipboardCheck" },
  { href: "/progress", key: "progress", icon: "ChartColumnIncreasing" },
  { href: "/admin", key: "admin", icon: "Shield" },
  { href: "/profile", key: "profile", icon: "User" },
  { href: "/settings", key: "settings", icon: "Settings" },
] as const;
