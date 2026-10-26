import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "./fixtures";

// The chat hydrates when the browser is idle; wait for the live component.
const chatReady = (page: Page) =>
  page.locator("astro-island:not([ssr]) .qb-chat").waitFor({ state: "attached" });

async function openChat(page: Page) {
  await chatReady(page);
  await page.getByRole("button", { name: "Chat with QB" }).click();
  return page.getByRole("region", { name: "Chat with QB" });
}

async function ask(page: Page, question: string) {
  await page.getByLabel("Ask QB a question").fill(question);
  await page.getByLabel("Ask QB a question").press("Enter");
}

test("QB greets, answers a suggested question and a typed one", async ({ page }) => {
  await page.goto("./");
  const chat = await openChat(page);
  await expect(chat).toContainText("Hi, I'm QB");
  await expect(page.getByLabel("Ask QB a question")).toBeFocused();

  await chat.getByRole("button", { name: "What does CUBES do?" }).click();
  await expect(chat.getByRole("log")).toContainText("ASP courses");

  await ask(page, "whats the difference between building and civil");
  await expect(chat.getByRole("log")).toContainText("Civil engineering covers infrastructure");
  await expect(
    chat.getByRole("link", { name: /Concordia Building Engineering/ }).last(),
  ).toBeVisible();
});

test("the next-event answer uses the visitor's clock", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-10T12:00:00-05:00"));
  await page.goto("events");
  const nextOnPage = (await page.locator("[data-next-event] .title").textContent())?.trim() ?? "";

  const chat = await openChat(page);
  await ask(page, "when is the next event?");
  await expect(chat.getByRole("log")).toContainText(`Next up: ${nextOnPage}`);
});

test("asking about an event by name gives its date", async ({ page }) => {
  await page.goto("./");
  const chat = await openChat(page);
  await ask(page, "when is cubesmas");
  await expect(chat.getByRole("log")).toContainText(/Cubesmas.*Nov/);
});

test("unknown questions get an honest answer and a way to reach a person", async ({ page }) => {
  await page.goto("./");
  const chat = await openChat(page);
  await ask(page, "can I become an architect");
  await expect(chat.getByRole("log")).toContainText("I don't know that one yet");
  await expect(chat.getByRole("link", { name: /@ecaconcordia\.ca/ })).toBeVisible();
});

test("Escape closes the chat and returns focus to the launcher", async ({ page }) => {
  await page.goto("./");
  const chat = await openChat(page);
  await page.keyboard.press("Escape");
  await expect(chat).toBeHidden();
  await expect(page.getByRole("button", { name: "Chat with QB" })).toBeFocused();
});

test("the conversation follows the visitor to the next page", async ({ page }) => {
  await page.goto("./");
  await openChat(page);
  await ask(page, "is there co-op?");
  await page.goto("about");
  await chatReady(page);
  await expect(page.getByRole("region", { name: "Chat with QB" }).getByRole("log")).toContainText(
    "three paid work terms",
  );
});

test("the open chat has no axe violations", async ({ page }) => {
  await page.goto("./");
  await openChat(page);
  await ask(page, "schedule");
  const results = await new AxeBuilder({ page })
    .include(".qb-chat")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
