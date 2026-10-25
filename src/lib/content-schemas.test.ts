import { z } from "astro/zod";
import { describe, expect, it } from "vitest";
import { eventSchema, faqSchema, productSchema, sponsorSchema } from "./content-schemas";

const image = () => z.string();
const product = productSchema(image);

const hoodie = {
  name: "Hoodie",
  photos: ["hoodie.jpg"],
  basePrice: 45,
  optionGroups: [
    {
      name: "Logo",
      choices: [
        { label: "Small logo", zeffyItem: "Hoodie - Small Logo" },
        { label: "Big logo", priceDelta: 5, zeffyItem: "Hoodie - Big Logo" },
      ],
    },
    { name: "Size", choices: [{ label: "S" }, { label: "M" }] },
  ],
  soldOut: [{ Size: "S" }],
  zeffy: { formUrl: "https://www.zeffy.com/en-CA/ticketing/merch" },
  fulfilment: "Pickup at MU403",
  zeffyPricesCheckedAt: "2026-10-25",
};

const issues = (result: { success: boolean; error?: z.ZodError }) =>
  result.error?.issues.map((i) => i.message).join("\n") ?? "";

describe("productSchema", () => {
  it("accepts a product whose priced option maps to Zeffy items", () => {
    const result = product.safeParse(hoodie);
    expect(issues(result)).toBe("");
    expect(result.data?.optionGroups[1]?.required).toBe(true);
    expect(result.data?.zeffyPricesCheckedAt).toBeInstanceOf(Date);
  });

  it("accepts a single-item product with a fixed Zeffy item", () => {
    const result = product.safeParse({
      ...hoodie,
      optionGroups: [{ name: "Size", choices: [{ label: "S" }] }],
      soldOut: [],
      zeffy: { formUrl: hoodie.zeffy.formUrl, item: "Sticker" },
    });
    expect(issues(result)).toBe("");
  });

  it("rejects a product with no way to pick a Zeffy item", () => {
    const result = product.safeParse({
      ...hoodie,
      optionGroups: [{ name: "Size", choices: [{ label: "S" }] }],
      soldOut: [],
    });
    expect(issues(result)).toMatch(/exactly one Zeffy item/);
  });

  it("rejects a priced group where some choices have no Zeffy item", () => {
    const [logo, size] = hoodie.optionGroups;
    const result = product.safeParse({
      ...hoodie,
      optionGroups: [{ ...logo, choices: [logo?.choices[0], { label: "Big logo" }] }, size],
    });
    expect(issues(result)).toMatch(/exactly one Zeffy item/);
  });

  it("rejects sold-out combinations that name unknown options", () => {
    const result = product.safeParse({ ...hoodie, soldOut: [{ Size: "XXXL" }] });
    expect(issues(result)).toMatch(/unknown option "Size: XXXL"/);
  });

  it("rejects duplicate choice labels", () => {
    const result = product.safeParse({
      ...hoodie,
      optionGroups: [
        hoodie.optionGroups[0],
        { name: "Size", choices: [{ label: "S" }, { label: "S" }] },
      ],
    });
    expect(issues(result)).toMatch(/must be unique/);
  });

  it("requires a price and at least one photo", () => {
    const result = product.safeParse({ ...hoodie, basePrice: undefined, photos: [] });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path[0])).toEqual(
      expect.arrayContaining(["basePrice", "photos"]),
    );
  });
});

describe("eventSchema", () => {
  const event = eventSchema(image);
  const base = {
    title: "Networking Cocktail",
    start: "2026-11-20T18:00:00-05:00",
    location: "EV Building",
    description: "Meet recruiters",
  };

  it("parses dates and defaults draft to false", () => {
    const result = event.safeParse(base);
    expect(issues(result)).toBe("");
    expect(result.data?.start.toISOString()).toBe("2026-11-20T23:00:00.000Z");
    expect(result.data?.draft).toBe(false);
  });

  it("rejects an end before the start", () => {
    const result = event.safeParse({ ...base, end: "2026-11-20T17:00:00-05:00" });
    expect(issues(result)).toMatch(/end must be on or after start/);
  });
});

describe("sponsorSchema", () => {
  it("only accepts known tiers", () => {
    const sponsor = sponsorSchema(image);
    const base = { name: "Acme", logo: "acme.svg", url: "https://acme.example" };
    expect(sponsor.safeParse({ ...base, tier: "gold" }).success).toBe(true);
    expect(sponsor.safeParse({ ...base, tier: "platinum" }).success).toBe(false);
  });
});

describe("faqSchema", () => {
  it("defaults to unreviewed and requires valid source URLs", () => {
    expect(faqSchema.parse({ question: "What is CUBES?" }).reviewed).toBe(false);
    const bad = faqSchema.safeParse({ question: "Q", sources: [{ label: "x", url: "not a url" }] });
    expect(bad.success).toBe(false);
  });
});
