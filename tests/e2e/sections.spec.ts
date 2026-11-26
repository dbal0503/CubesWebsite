import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// Rule-based checks, so they keep passing as events.yaml changes.
test.describe("events page with the clock at Nov 5, 2026", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-11-05T12:00:00-05:00"));
    await page.goto("events");
  });

  test("folds fully past months into Past events and keeps the rest in order", async ({ page }) => {
    const upcoming = await page
      .locator("[data-upcoming] [data-month]")
      .evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.month ?? ""));
    const past = await page
      .locator("[data-past-months] [data-month]")
      .evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.month ?? ""));

    expect(upcoming.length).toBeGreaterThan(0);
    for (const month of upcoming) expect(month >= "2026-11").toBe(true);
    for (const month of past) expect(month < "2026-11").toBe(true);
    expect(upcoming).toEqual([...upcoming].sort());

    if (past.length > 0) await expect(page.locator("[data-past-months]")).toBeVisible();
  });

  test("spotlights an upcoming event as next up", async ({ page }) => {
    const nextTitle = await page.locator("[data-next-event] [data-slot] .title").textContent();
    expect(nextTitle?.trim()).toBeTruthy();

    const nextCard = page
      .locator("[data-upcoming] [data-event-item]")
      .filter({ has: page.locator(".title", { hasText: nextTitle?.trim() ?? "" }) })
      .first();
    await expect(nextCard).toBeVisible();
    await expect(nextCard).not.toHaveAttribute("data-past");
  });
});

test("past event cards keep AA contrast", async ({ page }) => {
  // Mid-November: some November events are past while the month is still upcoming.
  await page.clock.setFixedTime(new Date("2026-11-10T12:00:00-05:00"));
  await page.goto("events");
  await page.locator("[data-past-months] summary").click();
  expect(await page.locator("[data-past]").count()).toBeGreaterThan(0);

  const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

test("home page shows the same next event as the events page", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-05T12:00:00-05:00"));
  await page.goto("events");
  const onEvents = await page.locator("[data-next-event] .title").textContent();
  await page.goto("./");
  await expect(page.locator("[data-next-event] .title")).toHaveText(onEvents ?? "");
});

test("team page shows the group photo, committees and execs", async ({ page }) => {
  await page.goto("team");
  await expect(page.getByRole("img", { name: /CUBES executive team/ })).toBeVisible();
  expect(await page.locator("#committees-heading + ul > li").count()).toBeGreaterThan(0);
  expect(await page.locator("#execs-heading + ul > li").count()).toBeGreaterThan(0);
});

test("why building engineering links each topic to its section", async ({ page }) => {
  await page.goto("why-building-engineering");
  const toc = page.getByRole("navigation", { name: "On this page" }).getByRole("link");
  expect(await toc.count()).toBeGreaterThan(0);
  for (const href of await toc.evaluateAll((links) => links.map((l) => l.getAttribute("href")))) {
    await expect(page.locator(href ?? "")).toHaveCount(1);
  }
});
