/**
 * Picks the FAQ answer for a typed question, with no AI involved: keywords
 * count double, words from the question once, multi-word keywords as whole
 * phrases. Below the threshold QB admits it doesn't know instead of guessing.
 */

export interface MatchableFaq {
  id: string;
  question: string;
  keywords: string[];
}

export type MatchResult =
  | { kind: "answer"; id: string }
  | { kind: "choose"; ids: [string, string] }
  | { kind: "none" };

const MIN_SCORE = 2;
const KEYWORD_WEIGHT = 2;
const QUESTION_WEIGHT = 1;
const PHRASE_WEIGHT = 3;

const STOPWORDS = new Set(
  (
    "a an and any are as at be can could do does for from have how i in is it me my " +
    "of on or should that the there this to want what whats when where which " +
    "will with would you your im know tell about get"
  ).split(" "),
);

// Spellings students type, mapped to the words the FAQ uses.
const SYNONYMS: Record<string, string> = {
  bldg: "building",
  eng: "engineering",
  engg: "engineering",
  civ: "civil",
  coop: "coop",
  internship: "coop",
  internships: "coop",
  merchandise: "merch",
  sweatshirt: "hoodie",
  hoody: "hoodie",
  careers: "career",
  jobs: "job",
};

/** Lowercase words with accents, punctuation and hyphens removed ("Co-op" → "coop"). */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/(\w)-(\w)/g, "$1$2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stem(word: string): string {
  const mapped = SYNONYMS[word] ?? word;
  return mapped.length > 4 && mapped.endsWith("s") && !mapped.endsWith("ss")
    ? mapped.slice(0, -1)
    : mapped;
}

/** Every word stemmed, stopwords kept, for matching multi-word keywords. */
function stemAll(text: string): string {
  return normalize(text).split(" ").map(stem).join(" ");
}

export function tokens(text: string): Set<string> {
  return new Set(
    normalize(text)
      .split(" ")
      .filter((w) => w && !STOPWORDS.has(w))
      .map(stem),
  );
}

export function score(input: string, faq: MatchableFaq): number {
  const words = tokens(input);
  const phraseText = ` ${stemAll(input)} `;
  const keywordWords = new Set<string>();
  let total = 0;

  for (const keyword of faq.keywords) {
    const phrase = stemAll(keyword);
    if (phrase.includes(" ")) {
      if (phraseText.includes(` ${phrase} `)) total += PHRASE_WEIGHT;
    } else {
      keywordWords.add(stem(phrase));
    }
  }
  const questionWords = tokens(faq.question);

  for (const word of words) {
    if (keywordWords.has(word)) total += KEYWORD_WEIGHT;
    else if (questionWords.has(word)) total += QUESTION_WEIGHT;
  }
  return total;
}

export interface Ranked {
  id: string;
  score: number;
}

export function rankFaqs(input: string, faqs: MatchableFaq[]): Ranked[] {
  return faqs
    .map((faq) => ({ id: faq.id, score: score(input, faq) }))
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);
}

// Words in event titles too generic to identify an event on their own.
const GENERIC_TITLE_WORDS = new Set(["event", "part", "weekend", "night", "day"]);
const EVENT_WORD_WEIGHT = 3;

/**
 * The event whose title best matches the question ("when's cubesmas?").
 * Only distinctive title words count: generic ones, and any word the FAQ
 * already uses (pass those in `ignore`), so "courses" still reaches the
 * course-sequence answer rather than the "ASP Course" event. `events` should
 * be in the preferred order (upcoming first); ties keep it.
 */
export function matchEvent(
  input: string,
  events: { id: string; title: string }[],
  ignore: Set<string> = new Set(),
): Ranked | undefined {
  const words = tokens(input);
  let best: Ranked | undefined;
  for (const event of events) {
    const title = [...tokens(event.title)].filter(
      (w) => !GENERIC_TITLE_WORDS.has(w) && !ignore.has(w) && !/^\d+$/.test(w),
    );
    const hits = title.filter((w) => words.has(w)).length;
    if (hits > 0 && (!best || hits * EVENT_WORD_WEIGHT > best.score)) {
      best = { id: event.id, score: hits * EVENT_WORD_WEIGHT };
    }
  }
  return best;
}

/** Every word the FAQ questions and keywords use. */
export function faqVocabulary(faqs: MatchableFaq[]): Set<string> {
  const words = new Set<string>();
  for (const faq of faqs) {
    for (const word of tokens(`${faq.question} ${faq.keywords.join(" ")}`)) words.add(word);
  }
  return words;
}

export type ChatMatch = MatchResult | { kind: "event"; id: string };

/** FAQ answer or event, whichever matches the question best. */
export function matchQuestion(
  input: string,
  faqs: MatchableFaq[],
  events: { id: string; title: string }[] = [],
): ChatMatch {
  const [best, second] = rankFaqs(input, faqs);
  const event = matchEvent(input, events, faqVocabulary(faqs));
  if (event && event.score >= (best?.score ?? 0)) return { kind: "event", id: event.id };
  if (!best) return { kind: "none" };
  if (second && best.score - second.score < 1) return { kind: "choose", ids: [best.id, second.id] };
  return { kind: "answer", id: best.id };
}
