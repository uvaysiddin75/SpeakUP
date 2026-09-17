import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSubtopicDetail } from "@/services/curriculum-service";

export default async function SubtopicTestRedirectPage({
  params,
}: {
  params: Promise<{
    locale: string;
    level: string;
    category: string;
    topic: string;
    subtopic: string;
  }>;
}) {
  const {
    locale,
    level: levelSlug,
    category: categorySlug,
    topic: topicSlug,
    subtopic: subtopicSlug,
  } = await params;
  setRequestLocale(locale);

  const subtopic = await getSubtopicDetail(
    levelSlug,
    categorySlug,
    topicSlug,
    subtopicSlug,
  );
  if (!subtopic) notFound();

  if (subtopic.quizId) {
    redirect(`/${locale}/quiz/${subtopic.quizId}`);
  }

  redirect(
    `/${locale}/courses/${levelSlug}/${categorySlug}/${topicSlug}/${subtopicSlug}`,
  );
}
