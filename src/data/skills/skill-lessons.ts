import {
  chooseWord,
  estimateDurationSec,
  fillBlank,
  hashSeed,
  mcq,
  mulberry32,
  pick,
  slugify,
  trueFalse,
} from "./helpers";
import type {
  Cefr,
  ListeningLessonSeed,
  ReadingLessonSeed,
  SkillQuestion,
  SpeakingLessonSeed,
} from "./types";

function buildComprehensionQuestions(
  seedKey: string,
  title: string,
  text: string,
  facts: Array<{ q: string; a: string; wrong: string[] }>,
  advanced = false,
): SkillQuestion[] {
  const rng = mulberry32(hashSeed(seedKey));
  const qs: SkillQuestion[] = [];
  qs.push(
    mcq(
      `What is the main idea of "${title}"?`,
      facts[0]?.a ?? title,
      facts.flatMap((f) => f.wrong).slice(0, 6),
      `The text mainly focuses on: ${facts[0]?.a ?? title}.`,
      rng,
    ),
  );
  for (const fact of facts) {
    qs.push(mcq(fact.q, fact.a, fact.wrong, `Correct: ${fact.a}`, rng));
    qs.push(trueFalse(`${fact.a} — according to the text.`, true, `True: ${fact.a}`));
    const wrong = pick(fact.wrong, rng);
    qs.push(
      trueFalse(
        `The text says: ${wrong}`,
        false,
        `False. The text supports: ${fact.a}`,
      ),
    );
  }
  const words = text.split(/\s+/).filter((w) => w.length > 5).slice(0, 8);
  for (const word of words.slice(0, 3)) {
    const clean = word.replace(/[^a-zA-Z'-]/g, "");
    if (!clean) continue;
    qs.push(
      chooseWord(
        `Which word appears in the text?`,
        clean,
        ["xylophone", "quasar", "bamboozle", "nebula"].filter((w) => w !== clean),
        `"${clean}" appears in the passage.`,
        rng,
      ),
    );
  }
  qs.push(
    fillBlank(
      `Complete: This text is titled "_____".`,
      title,
      `The title is "${title}".`,
    ),
  );
  if (advanced) {
    qs.push(
      mcq(
        "What is the author's likely purpose?",
        "To inform and analyse",
        ["To sell a product only", "To tell a children's joke", "To list grocery items"],
        "The tone is analytical/informative.",
        rng,
      ),
    );
    qs.push(
      mcq(
        "What is the overall tone?",
        "Measured and reflective",
        ["Purely comic", "Aggressive and hostile", "Completely neutral shopping list"],
        "The tone is measured and reflective.",
        rng,
      ),
    );
    qs.push(
      mcq(
        "Which inference is most reasonable?",
        "The writer expects readers to think critically",
        [
          "The writer wants silence only",
          "No opinions are present",
          "The text is a dictionary entry",
        ],
        "Critical reading is expected.",
        rng,
      ),
    );
  }
  while (qs.length < 12) {
    qs.push(
      trueFalse(
        `"${title}" is a reading/listening lesson in SpeakUp.`,
        true,
        "True for this course item.",
      ),
    );
  }
  return qs.slice(0, 16);
}

const READING_TITLES: Record<Cefr, string[]> = {
  A1: [
    "My Family",
    "A Day at School",
    "At the Cafe",
    "My Home",
    "Weekend Plans",
    "A Simple Email",
    "My Friend",
    "At the Shop",
  ],
  A2: [
    "A Travel Blog",
    "Job Advert",
    "Doctor Appointment",
    "City Guide",
    "Product Review",
    "Short News Story",
    "Restaurant Review",
    "Hotel Email",
  ],
  B1: [
    "Opinion Article",
    "Travel Experience",
    "Workplace Email",
    "Environment Report",
    "Film Review",
    "Interview Transcript",
    "Advice Column",
    "Local News Feature",
  ],
  B2: [
    "Feature Article",
    "Academic Abstract",
    "Business Case",
    "Editorial",
    "Research Summary",
    "Critical Review",
    "Interview Feature",
    "Policy Overview",
  ],
  C1: [
    "Dense Opinion Essay",
    "Policy Brief",
    "Literary Extract",
    "Scientific Popularization",
    "Long-form Journalism",
    "Analytical Commentary",
  ],
  C2: [
    "Literary Criticism",
    "Philosophical Argument",
    "Specialist Paper Extract",
    "Satirical Column",
    "Complex Legal-style Text",
    "Advanced Editorial",
  ],
};

function readingText(level: Cefr, title: string): string {
  const map: Record<Cefr, string> = {
    A1: `${title}. My name is Sam. I live in a small town. Every day I wake up early. I eat breakfast with my family. Then I go to school or work. In the evening I read a book or watch TV. I like simple days. My friends are kind. We talk and smile. On Saturday I help at home. Life is good.`,
    A2: `${title}. Last month I visited a new city for three days. I booked a small hotel near the station. In the morning I walked around the centre and took photos. I asked people for directions when I was lost. One afternoon I tried local food in a busy restaurant. The waiter was friendly and explained the menu. In the evening I wrote a short review on my phone. Travel helps me practise English and meet people.`,
    B1: `${title}. When I changed jobs last year, I learned how important clear communication is. At first the new team felt unfamiliar, and I worried about making mistakes. Gradually I started asking better questions and taking notes in meetings. I also joined a weekend English club to improve my confidence. Looking back, the experience taught me that progress is rarely sudden. Small habits — preparing before calls, checking emails twice, and listening carefully — made a real difference.`,
    B2: `${title}. Cities around the world are redesigning public space to support health, community, and climate goals. Rather than treating streets only as corridors for cars, planners are testing wider pavements, protected cycle lanes, and shaded seating. Evidence from pilot projects suggests that people walk more when routes feel safe and interesting. Critics warn about congestion and cost, yet many residents report quieter neighbourhoods and stronger local businesses. The debate is less about fashion and more about what kind of daily life a city chooses to enable.`,
    C1: `${title}. The contemporary workplace is being reshaped by remote tools, asynchronous collaboration, and shifting expectations of autonomy. Organisations that treat flexibility as a temporary emergency measure often struggle to maintain culture and clarity. By contrast, teams that redesign rituals — decision logs, focused meeting windows, and transparent priorities — tend to preserve both productivity and wellbeing. The harder question is equity: not every role can be remote, and hybrid models can unintentionally privilege those already visible to leadership. Sustainable policy therefore requires deliberate design rather than optimistic improvisation.`,
    C2: `${title}. To speak of style as mere ornament is to misunderstand how meaning is packaged. Cadence, register, and lexical precision do not decorate an argument; they constitute its persuasive force. A text that hedges without purpose becomes evasive, while one that asserts without warrant becomes brittle. Near-native control lies in modulating commitment: knowing when to concede, when to intensify, and when silence itself is rhetorical. In that sense, advanced literacy is less a store of rare words than a practised sensitivity to implication.`,
  };
  return map[level];
}

export const READING_CATALOG: Record<Cefr, ReadingLessonSeed[]> = Object.fromEntries(
  (Object.keys(READING_TITLES) as Cefr[]).map((level) => [
    level,
    READING_TITLES[level].map((title, index) => {
      const text = readingText(level, title);
      const facts = [
        {
          q: `What is this text mainly about?`,
          a: title,
          wrong: ["Cooking pasta only", "Football results", "Airport security rules"],
        },
        {
          q: `Which statement fits the passage best?`,
          a: "It discusses ideas related to the title topic.",
          wrong: [
            "It is only a shopping list",
            "It contains no complete sentences",
            "It is written only in numbers",
          ],
        },
        {
          q: `What should a reader do after reading?`,
          a: "Answer comprehension questions about details and meaning.",
          wrong: [
            "Ignore the text completely",
            "Delete all vocabulary",
            "Skip any thinking",
          ],
        },
      ];
      return {
        slug: slugify(title),
        title,
        description: `${level} reading: ${title}`,
        text,
        vocabulary: [
          { word: title.split(" ")[0]!.toLowerCase(), meaning: "key topic word" },
          { word: "understand", meaning: "to know the meaning" },
          { word: "detail", meaning: "a small piece of information" },
        ],
        importantWords: text
          .split(/\s+/)
          .filter((w) => w.length > 6)
          .slice(0, 5)
          .map((w) => w.replace(/[^a-zA-Z'-]/g, "")),
        difficulty: level.startsWith("A") ? "EASY" : level.startsWith("B") ? "MEDIUM" : "HARD",
        questions: buildComprehensionQuestions(
          `${level}:read:${index}:${title}`,
          title,
          text,
          facts,
          level === "B2" || level === "C1" || level === "C2",
        ),
      } satisfies ReadingLessonSeed;
    }),
  ]),
) as Record<Cefr, ReadingLessonSeed[]>;

const LISTENING_TITLES: Record<Cefr, string[]> = {
  A1: [
    "Introducing Yourself",
    "Ordering Food",
    "Asking for Directions",
    "Classroom Instructions",
    "Phone Numbers and Times",
    "Shopping Dialogue",
    "Family Talk",
    "Daily Routine Chat",
  ],
  A2: [
    "At the Airport",
    "Booking a Hotel",
    "At the Doctor",
    "Shopping Returns",
    "Weather Forecast",
    "Making Plans",
    "Restaurant Booking",
    "Getting Directions",
  ],
  B1: [
    "Podcast Extract",
    "Job Interview",
    "University Talk",
    "Customer Service Call",
    "News Summary",
    "Discussion Panel",
    "Travel Problem Call",
    "Everyday Debate",
  ],
  B2: [
    "Lecture Extract",
    "Debate",
    "Documentary Clip",
    "Negotiation",
    "Conference Talk",
    "Expert Interview",
    "Podcast Debate",
    "News Report Long",
  ],
  C1: [
    "Academic Lecture",
    "Panel Discussion",
    "Complex Interview",
    "Policy Debate",
    "Podcast Analysis",
    "Professional Briefing",
  ],
  C2: [
    "Dense Lecture",
    "Subtle Disagreement",
    "Rhetorical Speech",
    "Ambiguous Dialogue",
    "Expert Q and A",
    "Professional Roundtable",
  ],
};

function listeningTranscript(level: Cefr, title: string): string {
  const map: Record<Cefr, string> = {
    A1: `Hello. Today we practise ${title}. My name is Anna. I am a student. I live near the park. In the morning I wake up at seven. I drink tea and eat bread. Then I go to school. Please listen and answer the questions.`,
    A2: `Good afternoon. This recording is about ${title}. Last week I travelled by train. I arrived late because the weather was bad. A helpful assistant showed me the correct platform. I learned useful phrases for travel, food, and plans. Listen carefully for times, places, and reasons.`,
    B1: `Welcome back. In this episode we discuss ${title}. Many learners say they understand grammar but freeze in real conversations. Our guest explains how preparation, polite phrases, and follow-up questions reduce stress. She also shares a short story about a difficult phone call that became easier after practice.`,
    B2: `In today's talk on ${title}, we examine competing viewpoints with evidence. One speaker argues for rapid change; another urges caution and better measurement. Listen for attitude markers, examples, and what is implied rather than stated. You will hear numbers, dates, and a brief disagreement about priorities.`,
    C1: `This briefing on ${title} assumes familiarity with professional discussion. The speaker evaluates trade-offs, acknowledges uncertainty, and invites challenge. Pay attention to hedging, emphasis, and how recommendations are framed. Details matter: names, conditions, and the rationale behind each proposal.`,
    C2: `Consider ${title} as a case of sophisticated spoken discourse. The exchange moves between concession and critique, sometimes leaving meaning intentionally open. Track stance, irony, and the burden of proof. Advanced listening here means hearing what is suggested between turns.`,
  };
  return map[level];
}

export const LISTENING_CATALOG: Record<Cefr, ListeningLessonSeed[]> = Object.fromEntries(
  (Object.keys(LISTENING_TITLES) as Cefr[]).map((level) => [
    level,
    LISTENING_TITLES[level].map((title, index) => {
      const transcript = listeningTranscript(level, title);
      const facts = [
        {
          q: "What is the recording mainly about?",
          a: title,
          wrong: ["Silent meditation only", "Cooking oil prices", "Football line-ups"],
        },
        {
          q: "What should you do first?",
          a: "Listen carefully before opening the transcript",
          wrong: [
            "Ignore the audio",
            "Skip all questions",
            "Read a different topic only",
          ],
        },
        {
          q: "Which skill is practised?",
          a: "Listening for meaning and details",
          wrong: ["Only handwriting", "Only drawing", "Only swimming"],
        },
      ];
      return {
        slug: slugify(title),
        title,
        description: `${level} listening: ${title}`,
        transcript,
        vocabulary: [
          { word: "listen", meaning: "to pay attention to sound" },
          { word: "speaker", meaning: "the person talking" },
          { word: "detail", meaning: "a specific piece of information" },
        ],
        difficulty: level.startsWith("A") ? "EASY" : level.startsWith("B") ? "MEDIUM" : "HARD",
        durationSec: estimateDurationSec(transcript),
        questions: buildComprehensionQuestions(
          `${level}:listen:${index}:${title}`,
          title,
          transcript,
          facts,
          level === "B2" || level === "C1" || level === "C2",
        ),
      } satisfies ListeningLessonSeed;
    }),
  ]),
) as Record<Cefr, ListeningLessonSeed[]>;

const SPEAKING_TITLES: Record<
  Cefr,
  Array<{ title: string; type: SpeakingLessonSeed["exerciseType"] }>
> = {
  A1: [
    { title: "Introduce Yourself", type: "TALK_TOPIC" },
    { title: "My Family", type: "TALK_TOPIC" },
    { title: "My Home", type: "DESCRIBE_PICTURE" },
    { title: "My School", type: "TALK_TOPIC" },
    { title: "My Daily Routine", type: "TALK_TOPIC" },
    { title: "My Hobbies", type: "TALK_TOPIC" },
    { title: "My Favorite Food", type: "ANSWER_QUESTION" },
    { title: "My City", type: "DESCRIBE_PICTURE" },
    { title: "My Friends", type: "TALK_TOPIC" },
    { title: "My Weekend", type: "TALK_TOPIC" },
  ],
  A2: [
    { title: "My Weekend", type: "TALK_TOPIC" },
    { title: "Travel Story", type: "TALK_TOPIC" },
    { title: "Shopping Talk", type: "ROLE_PLAY" },
    { title: "Friends", type: "TALK_TOPIC" },
    { title: "Weather Chat", type: "ANSWER_QUESTION" },
    { title: "Future Plans", type: "TALK_TOPIC" },
    { title: "Holidays", type: "TALK_TOPIC" },
    { title: "Work Day", type: "TALK_TOPIC" },
    { title: "Give Opinions Simply", type: "GIVE_OPINION" },
    { title: "Compare Two Cities", type: "GIVE_OPINION" },
  ],
  B1: [
    { title: "Give Your Opinion", type: "GIVE_OPINION" },
    { title: "Describe an Experience", type: "TALK_TOPIC" },
    { title: "Talk About Your Goals", type: "TALK_TOPIC" },
    { title: "Discuss Education", type: "GIVE_OPINION" },
    { title: "Discuss Technology", type: "GIVE_OPINION" },
    { title: "Describe a Problem", type: "ANSWER_QUESTION" },
    { title: "Agree and Disagree", type: "DEBATE" },
    { title: "Narrate a Story", type: "TALK_TOPIC" },
    { title: "Compare Options", type: "GIVE_OPINION" },
    { title: "Speculate About Future", type: "GIVE_OPINION" },
  ],
  B2: [
    { title: "Debate a Statement", type: "DEBATE" },
    { title: "Agree or Disagree", type: "DEBATE" },
    { title: "Give Arguments", type: "GIVE_OPINION" },
    { title: "Present an Idea", type: "TALK_TOPIC" },
    { title: "Discuss Social Issues", type: "DEBATE" },
    { title: "Job Interview Practice", type: "ROLE_PLAY" },
    { title: "Negotiate a Solution", type: "ROLE_PLAY" },
    { title: "Summarize a Talk", type: "ANSWER_QUESTION" },
    { title: "Defend an Opinion", type: "DEBATE" },
    { title: "Discuss Abstract Topics", type: "GIVE_OPINION" },
  ],
  C1: [
    { title: "Academic Discussion", type: "DEBATE" },
    { title: "Professional Presentation", type: "TALK_TOPIC" },
    { title: "Complex Debate", type: "DEBATE" },
    { title: "Complex Opinion", type: "GIVE_OPINION" },
    { title: "Problem Solving Talk", type: "ROLE_PLAY" },
    { title: "Persuasive Speaking", type: "GIVE_OPINION" },
    { title: "Challenge Assumptions", type: "DEBATE" },
    { title: "Handle Follow-up Questions", type: "ANSWER_QUESTION" },
  ],
  C2: [
    { title: "Advanced Debate", type: "DEBATE" },
    { title: "Academic Presentation", type: "TALK_TOPIC" },
    { title: "Professional Discussion", type: "ROLE_PLAY" },
    { title: "Complex Argument", type: "DEBATE" },
    { title: "Abstract Topics", type: "GIVE_OPINION" },
    { title: "Critical Discussion", type: "DEBATE" },
    { title: "Mediate Conflicting Views", type: "ROLE_PLAY" },
    { title: "Near-native Fluency Drill", type: "READ_ALOUD" },
  ],
};

export const SPEAKING_CATALOG: Record<Cefr, SpeakingLessonSeed[]> = Object.fromEntries(
  (Object.keys(SPEAKING_TITLES) as Cefr[]).map((level) => [
    level,
    SPEAKING_TITLES[level].map((item) => ({
      slug: slugify(item.title),
      title: item.title,
      prompt: `Speak about: ${item.title}. Aim for ${level === "A1" || level === "A2" ? "1–2" : "2–3"} minutes.`,
      instructions: `Record your answer for "${item.title}". Use the useful phrases. Then complete self-evaluation.`,
      usefulVocabulary: [item.title.split(" ")[0]!, "because", "usually", "important", "example"],
      usefulPhrases: [
        "I usually...",
        "In my opinion...",
        "For example...",
        "On the one hand...",
        "Finally...",
      ],
      exampleAnswer: `For ${item.title}, I would start with a clear opening, give two examples, and finish with a short conclusion. At ${level} level, I try to speak clearly and organise my ideas.`,
      exerciseType: item.type,
      timerSec: level.startsWith("A") ? 90 : level.startsWith("B") ? 120 : 150,
      tips: "Speak at a natural pace. Pause to think. Do not read the whole example aloud unless the task is Read aloud.",
      difficulty: level.startsWith("A") ? "EASY" : level.startsWith("B") ? "MEDIUM" : "HARD",
    })),
  ]),
) as Record<Cefr, SpeakingLessonSeed[]>;
