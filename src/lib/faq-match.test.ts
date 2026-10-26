import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { type MatchableFaq, matchQuestion, normalize } from "./faq-match";

// The real content, so keyword edits that break common questions fail here.
const faqDir = path.resolve("src/content/faq");
const faqs: MatchableFaq[] = readdirSync(faqDir)
  .filter((f) => f.endsWith(".md"))
  .flatMap((file) => {
    const frontmatter = readFileSync(path.join(faqDir, file), "utf8").split("---")[1] ?? "";
    const data = parseYaml(frontmatter) as MatchableFaq & { draft?: boolean };
    return data.draft
      ? []
      : [{ id: file.replace(/\.md$/, ""), question: data.question, keywords: data.keywords ?? [] }];
  });

const events = (
  parseYaml(readFileSync(path.resolve("src/content/events.yaml"), "utf8")) as {
    id: string;
    title: string;
    draft?: boolean;
  }[]
).filter((e) => !e.draft);

const ASKS: [question: string, expected: string][] = [
  // next event
  ["When is the next event?", "faq:next-event"],
  ["whens our next event", "faq:next-event"],
  ["any upcoming events?", "faq:next-event"],
  ["events", "faq:next-event"],
  ["what's happening", "faq:next-event"],
  // what CUBES does
  ["What does CUBES do?", "faq:what-does-cubes-do"],
  ["what is cubes", "faq:what-does-cubes-do"],
  ["who are you guys", "faq:what-does-cubes-do"],
  ["tell me about the club", "faq:what-does-cubes-do"],
  // building vs civil
  ["What's the difference between building and civil?", "faq:building-vs-civil"],
  ["building vs civil", "faq:building-vs-civil"],
  ["is bldg eng the same as civil", "faq:building-vs-civil"],
  // careers
  ["What jobs can I get?", "faq:careers"],
  ["career options after graduation", "faq:careers"],
  ["what's the salary like", "faq:careers"],
  ["who hires building engineers", "faq:careers"],
  // courses
  ["what courses do i take in first year", "faq:course-sequence"],
  ["course sequence", "faq:course-sequence"],
  ["what classes are in the curriculum", "faq:course-sequence"],
  // options
  ["what are the specializations", "faq:options"],
  ["energy option", "faq:options"],
  // co-op
  ["is there co-op?", "faq:co-op"],
  ["internships", "faq:co-op"],
  ["are work terms paid", "faq:co-op"],
  // merch
  ["where can I buy a hoodie", "faq:merch"],
  ["merch", "faq:merch"],
  // sponsor
  ["how do I sponsor cubes", "faq:sponsor"],
  ["my company wants to partner with you", "faq:sponsor"],
  // contact
  ["how do i contact you", "faq:contact"],
  ["email", "faq:contact"],
  ["where is your office", "faq:contact"],
  // specific events by name
  ["when is cubesmas", "event:cubesmas-2026"],
  ["ASP course dates", "event:asp-certification-weekend-1-2026"],
  ["when's the gingerbread competition?", "event:gingerbread-competition-2026"],
  ["revit competition", "event:revit-competition-2027"],
  // no answer: QB says so instead of guessing
  ["can I become an architect", "none"],
  ["asdfgh", "none"],
  ["hello", "none"],
  ["", "none"],
];

describe("matchQuestion against the real FAQ and events", () => {
  it.each(ASKS)("%s → %s", (question, expected) => {
    const result = matchQuestion(question, faqs, events);
    const label =
      result.kind === "answer"
        ? `faq:${result.id}`
        : result.kind === "event"
          ? `event:${result.id}`
          : result.kind === "choose"
            ? `choose:${result.ids.join("|")}`
            : "none";
    expect(label).toBe(expected);
  });

  it("offers a choice when two answers tie", () => {
    const result = matchQuestion("schedule", faqs, events);
    expect(result.kind).toBe("choose");
    expect(result.kind === "choose" && [...result.ids].sort()).toEqual([
      "course-sequence",
      "next-event",
    ]);
  });
});

describe("normalize", () => {
  it("drops accents, apostrophes and hyphens inside words", () => {
    expect(normalize("Whén's the Co-op?")).toBe("whens the coop");
  });
});
