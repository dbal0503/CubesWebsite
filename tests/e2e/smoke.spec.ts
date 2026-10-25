import { expect, test } from "@playwright/test";

test("home page renders with images served under the base path", async ({ page }) => {
  await page.goto("./");

  await expect(page).toHaveTitle(/CUBES/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const images = await page.getByRole("img").all();
  expect(images.length).toBeGreaterThan(0);
  for (const img of images) {
    const src = await img.getAttribute("src");
    expect(src).toMatch(/^\/CubesWebsite\//);
    const response = await page.request.get(src ?? "");
    expect(response.status(), src ?? "").toBe(200);
  }
});

test("favicons load from the base path", async ({ page }) => {
  await page.goto("./");

  const icons = page.locator('link[rel="icon"], link[rel="apple-touch-icon"]');
  await expect(icons).toHaveCount(3);
  for (const href of await icons.evaluateAll((links) => links.map((l) => l.getAttribute("href")))) {
    expect(href).toMatch(/^\/CubesWebsite\//);
    const response = await page.request.get(href ?? "");
    expect(response.status(), href ?? "").toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  }
});
