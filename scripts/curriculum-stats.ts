import { CURRICULUM_TREE } from "../src/data/curriculum/tree";
import { QUIZ_QUESTION_COUNTS } from "../src/lib/curriculum";

let topics = 0;
let subtopics = 0;
let contentSubtopics = 0;

for (const level of CURRICULUM_TREE) {
  for (const category of level.categories) {
    topics += category.topics.length;
    for (const topic of category.topics) {
      subtopics += topic.subtopics.length;
      contentSubtopics += topic.subtopics.filter((s) => s.withContent).length;
    }
  }
}

const estimatedQuestions = contentSubtopics * QUIZ_QUESTION_COUNTS.SUBTOPIC;

console.log("SpeakUp curriculum dry-run (no database)");
console.table({
  levels: CURRICULUM_TREE.length,
  categories: CURRICULUM_TREE.length * 6,
  topics,
  subtopics,
  contentSubtopics,
  estimatedSubtopicQuestions: estimatedQuestions,
});
