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
