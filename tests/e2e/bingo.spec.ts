import AxeBuilder from "@axe-core/playwright";
import { test as firstVisit } from "@playwright/test";
import { expect, type Page, test } from "./fixtures";

const CARD_1_ROW_1_IDS = [
  "sleigh",
  "winter-wonderland",
  "mistletoe",
  "gingerbread",
  "last-christmas",
];

const hydrated = (page: Page, selector: string) =>
  page.locator(`astro-island:not([ssr]) ${selector}`).waitFor({ state: "attached" });

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  // Keep tests off the network: the host page embeds YouTube.
  await page.route(/youtube(-nocookie)?\.com/, (route) => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("the bingo page links the caller and the printable cards", async ({ page, request }) => {
  await page.goto("bingo/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Cubesmas Bingo");
  const pdf = await page.getByRole("link", { name: "Printable cards (PDF)" }).getAttribute("href");
  expect((await request.get(pdf ?? "")).status()).toBe(200);
  await page.getByRole("link", { name: "Open the caller" }).first().click();
  await expect(page).toHaveURL(/bingo\/host\/$/);
  await expectNoAxeViolations(page);
});

test("the caller draws, undoes and checks a card", async ({ page }) => {
  await page.goto("bingo/host/");
  await hydrated(page, ".bh[data-ready]");

  await page.getByRole("button", { name: "Draw first call" }).click();
  await expect(page.locator(".bh-count")).toContainText("1 of 39");
  await expect(page.locator(".bh-board li.is-latest")).toHaveCount(1);

  await page.getByRole("button", { name: /^Undo/ }).click();
  await expect(page.locator(".bh-count")).toContainText("0 of 39");

  await page.getByLabel("Check a card").fill("1");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Card #01: not yet");
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expectNoAxeViolations(page);
});

test("the caller runs from the keyboard", async ({ page }) => {
  await page.goto("bingo/host/");
  await hydrated(page, ".bh[data-ready]");
  await page.locator("body").press("Space");
  await expect(page.locator(".bh-count")).toContainText("1 of 39");
  await page.locator("body").press("ArrowRight");
  await expect(page.locator(".bh-count")).toContainText("2 of 39");
  await page.locator("body").press("u");
  await expect(page.locator(".bh-count")).toContainText("1 of 39");
});

test("the caller confirms a real BINGO and plays the song", async ({ page }) => {
  await page.addInitScript((ids) => {
    localStorage.setItem("cubes-bingo-host", JSON.stringify(ids));
  }, CARD_1_ROW_1_IDS);
  await page.goto("bingo/host/");
  await hydrated(page, ".bh[data-ready]");

  await expect(page.locator(".bh-label")).toContainText("Last Christmas");
  await expect(page.locator(".bh-recent")).toContainText("Gingerbread");
  await page.getByRole("button", { name: /Play the song/ }).click();
  await expect(page.locator(".bh-video iframe")).toHaveAttribute(
    "src",
    /youtube-nocookie\.com\/embed\/E8gmARGvPlI\?start=15&end=58/,
  );
  await page.locator("body").press("p");
  await expect(page.locator(".bh-video iframe")).toHaveCount(0);

  await page.getByLabel("Check a card").fill("1");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Card #01: BINGO!");
  await expect(page.getByRole("dialog")).toContainText("Row 1");
});

firstVisit(
  "the caller opens straight away on a first visit, without the 2D/3D chooser",
  async ({ page }) => {
    await page.route(/youtube(-nocookie)?\.com/, (route) => route.abort());
    await page.goto("bingo/host/");
    await hydrated(page, ".bh[data-ready]");
    await expect(page.getByRole("dialog", { name: "Welcome to Cubesville" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.dataset.chooser)).toBeUndefined();
    await page.getByRole("button", { name: "Draw first call" }).click();
    await expect(page.locator(".bh-count")).toContainText("1 of 39");
  },
);
