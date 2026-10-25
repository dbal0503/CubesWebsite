import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  "./",
  "about",
  "why-building-engineering",
  "events",
  "team",
  "sponsors",
  "shop",
  "does-not-exist",
];

for (const path of PAGES) {
  test(`${path} has no axe violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}

test("every nav link opens a real page", async ({ page, request }) => {
  await page.goto("./");
  const hrefs = await page
    .getByRole("navigation", { name: "Footer" })
    .getByRole("link")
    .evaluateAll((links) => links.map((l) => l.getAttribute("href")));

  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    const response = await request.get(href ?? "");
    expect(response.status(), href ?? "").toBe(200);
  }
});

test("the current page is marked in the main nav", async ({ page }) => {
  await page.goto("sponsors");
  // By id rather than role: on mobile the nav is collapsed, which hides it from role queries.
  await expect(page.locator('#site-nav [aria-current="page"]')).toHaveText("Sponsors");
});

test("unknown URLs get the 404 page", async ({ page }) => {
  const response = await page.goto("does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page got demolished");
});

test.describe("mobile menu", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens, closes with Escape, and returns focus to the toggle", async ({ page }) => {
    await page.goto("./");
    const toggle = page.getByRole("button", { name: "Menu" });
    const nav = page.getByRole("navigation", { name: "Main" });

    await expect(nav).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(nav.getByRole("link", { name: "Shop" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
    await expect(toggle).toBeFocused();
  });
});

test("skip link moves focus to the main content", async ({ page }) => {
  await page.goto("./");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});
