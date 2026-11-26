import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// Playwright's own `test` (not ./fixtures): every test here is a first visit.

const chooser = (page: Page) => page.getByRole("dialog", { name: "Welcome to Cubesville" });

test("a deep link opens on the chooser, and 2D lands on the requested page", async ({ page }) => {
  await page.goto("team");
  await expect(chooser(page)).toBeVisible();
  await expect(page.getByRole("button", { name: /Classic site/ })).toBeFocused();

  await page.getByRole("button", { name: /Classic site/ }).click();
  await expect(chooser(page)).toBeHidden({ timeout: 6000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Meet the team");
  await expect(page.locator("main")).toBeFocused();
});

test("the choice lasts for the visit", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Classic site/ }).click();
  await expect(chooser(page)).toBeHidden({ timeout: 6000 });

  await page.goto("events");
  await expect(chooser(page)).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.dataset.mode)).toBe("2d");
});

test("a new visit asks again", async ({ browser }) => {
  for (let visit = 0; visit < 2; visit++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("./");
    await expect(chooser(page)).toBeVisible();
    await context.close();
  }
});

test("3D is shown as coming soon and can't be chosen", async ({ page }) => {
  await page.goto("./");
  const soon = chooser(page).locator(".option-soon");
  await expect(soon).toContainText("Coming soon");
  await expect(soon).toHaveAttribute("aria-disabled", "true");
  await expect(chooser(page).getByRole("button")).toHaveCount(1);
});

test("the page behind the chooser can't be reached by keyboard", async ({ page }) => {
  await page.goto("./");
  // The chooser's script focuses the 2D button once it has locked the page behind.
  await expect(page.getByRole("button", { name: /Classic site/ })).toBeFocused();
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    const inChooser = await page.evaluate(
      () => document.activeElement?.closest("[data-mode-chooser]") !== null,
    );
    expect(inChooser || (await page.evaluate(() => document.activeElement === document.body))).toBe(
      true,
    );
  }
});

test("loading shows progress, then the chooser leaves", async ({ page }) => {
  await page.goto("about");
  await page.getByRole("button", { name: /Classic site/ }).click();
  await expect(page.getByText("Building Cubesville…")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Loading" })).toBeVisible();
  await expect(chooser(page)).toBeHidden({ timeout: 6000 });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("QB stays still and the chooser still closes", async ({ page }) => {
    await page.goto("./");
    await page.waitForTimeout(1500);
    const active = await page.locator("[data-mode-chooser] .qb-frame.is-active").count();
    expect(active).toBe(1);
    expect(
      await page.locator("[data-mode-chooser] .qb-frame.is-active").getAttribute("data-frame"),
    ).toBe("0");

    await page.getByRole("button", { name: /Classic site/ }).click();
    await expect(chooser(page)).toBeHidden({ timeout: 6000 });
  });
});

test("the chooser has no axe violations", async ({ page }) => {
  await page.goto("./");
  await expect(chooser(page)).toBeVisible();
  const results = await new AxeBuilder({ page })
    .include("[data-mode-chooser]")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
