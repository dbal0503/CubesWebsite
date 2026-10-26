import AxeBuilder from "@axe-core/playwright";
import { site } from "../../src/data/site";
import { expect, type Page, test } from "./fixtures";

test.describe("closed shop", () => {
  test.skip(site.merch.shopOpen, "the shop is open");

  test("shows under construction with a link to the Zeffy store", async ({ page, request }) => {
    await page.goto("shop");
    await expect(page.getByText("Under construction")).toBeVisible();
    await expect(page.getByRole("link", { name: "Order merch on Zeffy" })).toHaveAttribute(
      "href",
      site.merch.zeffyUrl,
    );
    expect((await request.get("shop/hoodie")).status()).toBe(404);
  });
});

// Everything below covers the open shop (site.merch.shopOpen).
test.skip(!site.merch.shopOpen, "the shop is closed (site.merch.shopOpen is false)");

// Never hit Zeffy from tests: its bot protection blocks headless browsers anyway.
test.beforeEach(async ({ page }) => {
  await page.route("https://www.zeffy.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<p>Zeffy stub</p>" }),
  );
});

// Astro drops the island's `ssr` attribute once the component has hydrated.
async function openProduct(page: Page, path: string) {
  await page.goto(path);
  await page.locator("astro-island:not([ssr]) .cfg").waitFor();
}

// Radios by role: the transparent native input sits on top of each pill, as for real users.
const pick = (page: Page, group: string, label: string) =>
  page
    .getByRole("group", { name: new RegExp(`^${group}`) })
    .getByRole("radio", { name: new RegExp(`^${label}`) })
    .check();

test("listing links to every product page", async ({ page, request }) => {
  await page.goto("shop");
  const links = page.locator(".products a");
  expect(await links.count()).toBeGreaterThan(0);
  await expect(links.first()).toContainText(/From \$\d+/);
  for (const href of await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")))) {
    expect((await request.get(href ?? "")).status(), href ?? "").toBe(200);
  }
});

test("price updates as options change and the selection lands in the URL", async ({ page }) => {
  await openProduct(page, "shop/hoodie");
  const price = page.locator(".cfg-price");
  await expect(price).toContainText("$45");

  await pick(page, "Logo", "Big logo");
  await expect(price).toContainText("$50");
  await pick(page, "Sleeve personalization", "Name on sleeve");
  await expect(price).toContainText("$57");
  await expect(page).toHaveURL(/Logo=Big\+logo/);
});

test("choices ticked before the page finishes loading are kept", async ({ page }) => {
  // Hold the page's scripts so the configurator stays server-rendered while we click.
  let release = () => {};
  const scriptsHeld = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/_astro\/.*\.js$/, async (route) => {
    await scriptsHeld;
    await route.continue();
  });

  await page.goto("shop/hoodie", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: /Checkout/ })).toBeDisabled();
  await pick(page, "Logo", "Big logo");

  release();
  await page.locator("astro-island:not([ssr]) .cfg").waitFor();
  await expect(page.locator(".cfg-price")).toContainText("$50");
  await expect(page.getByRole("radio", { name: /^Big logo/ })).toBeChecked();
  await expect(page.getByRole("button", { name: /Checkout/ })).toBeEnabled();
});

test("checkout asks for missing options before opening Zeffy", async ({ page }) => {
  await openProduct(page, "shop/hoodie");
  await page.getByRole("button", { name: /Checkout/ }).click();

  await expect(page.getByText("Choose a size.")).toBeVisible();
  await expect(page.getByText("Choose a color.")).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("a shared link restores the selection and checkout shows what to pick on Zeffy", async ({
  page,
}) => {
  await openProduct(
    page,
    "shop/hoodie?Logo=Big+logo&Back+Design=With+Back+Design&Sleeve+personalization=Name+on+sleeve&Size=L&Color=Burgundy",
  );
  await expect(page.locator(".cfg-price")).toContainText("$57");
  await expect(page.getByRole("radio", { name: "L", exact: true })).toBeChecked();

  await page.getByRole("button", { name: /Checkout/ }).click();
  const dialog = page.getByRole("dialog", { name: "Checkout" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Hoodie - Big Logo");
  await expect(dialog).toContainText("Back Design: With Back Design · Size: L · Color: Burgundy");
  await expect(dialog).toContainText("Personalization On Sleeve/item × 1");
  await expect(dialog).toContainText("Expected total: $57");
  await expect(dialog.locator("iframe")).toHaveAttribute(
    "src",
    /^https:\/\/www\.zeffy\.com\/en-CA\/embed\/ticketing\//,
  );

  const results = await new AxeBuilder({ page })
    .include(".cfg-drawer")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("product page has no axe violations", async ({ page }) => {
  await openProduct(page, "shop/hoodie");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
