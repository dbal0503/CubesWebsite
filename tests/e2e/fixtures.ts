import { test as base } from "@playwright/test";

export { expect, type Page } from "@playwright/test";

/**
 * Pages as a returning visitor sees them: the 2D/3D chooser was already
 * answered this visit, so it stays out of the way. chooser.spec.ts uses
 * Playwright's own `test` to see first visits.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => sessionStorage.setItem("cubes-mode", "2d"));
    await use(page);
  },
});
