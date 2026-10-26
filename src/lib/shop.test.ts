import { describe, expect, it } from "vitest";
import {
  formatPrice,
  fromPrice,
  initialSelection,
  isSoldOut,
  missingGroups,
  type ShopProduct,
  selectionToParams,
  totalPrice,
  wouldBeSoldOut,
  zeffyEmbedUrl,
  zeffyOrder,
} from "./shop";

const hoodie: ShopProduct = {
  name: "Hoodie",
  basePrice: 45,
  zeffy: { formUrl: "https://www.zeffy.com/en-CA/ticketing/merch-fall-2026" },
  soldOut: [{ Size: "XS", Color: "Sand" }],
  optionGroups: [
    {
      name: "Logo",
      required: true,
      preselect: true,
      choices: [
        { label: "Small logo", priceDelta: 0, zeffyItem: "Hoodie - Small Logo" },
        { label: "Big logo", priceDelta: 5, zeffyItem: "Hoodie - Big Logo" },
      ],
    },
    {
      name: "Back Design",
      required: true,
      preselect: true,
      choices: [
        { label: "No Back Design", priceDelta: 0 },
        { label: "With Back Design", priceDelta: 0 },
      ],
    },
    {
      name: "Size",
      required: true,
      preselect: false,
      choices: [
        { label: "XS", priceDelta: 0 },
        { label: "L", priceDelta: 0 },
      ],
    },
    {
      name: "Color",
      required: true,
      preselect: false,
      choices: [
        { label: "Burgundy", priceDelta: 0 },
        { label: "Sand", priceDelta: 0 },
      ],
    },
    {
      name: "Sleeve personalization",
      required: true,
      preselect: true,
      choices: [
        { label: "None", priceDelta: 0 },
        { label: "Name on sleeve", priceDelta: 7, zeffyAddOn: "Personalization On Sleeve/item" },
      ],
    },
  ],
};

const full = {
  Logo: "Big logo",
  "Back Design": "With Back Design",
  Size: "L",
  Color: "Burgundy",
  "Sleeve personalization": "Name on sleeve",
};

describe("initialSelection", () => {
  it("preselects the first choice except where preselect is off", () => {
    expect(initialSelection(hoodie)).toEqual({
      Logo: "Small logo",
      "Back Design": "No Back Design",
      "Sleeve personalization": "None",
    });
  });

  it("restores a selection from the URL and ignores unknown values", () => {
    const params = new URLSearchParams({ Logo: "Big logo", Size: "L", Color: "Purple" });
    const selection = initialSelection(hoodie, params);
    expect(selection.Logo).toBe("Big logo");
    expect(selection.Size).toBe("L");
    expect(selection.Color).toBeUndefined();
  });

  it("round-trips through URL params", () => {
    expect(initialSelection(hoodie, selectionToParams(full))).toEqual(full);
  });

  it("won't restore a sold-out combination from the URL", () => {
    const params = new URLSearchParams({ Size: "XS", Color: "Sand" });
    expect(isSoldOut(hoodie, initialSelection(hoodie, params))).toBe(false);
  });
});

describe("prices", () => {
  it("adds every chosen price difference to the base price", () => {
    expect(totalPrice(hoodie, initialSelection(hoodie))).toBe(45);
    expect(totalPrice(hoodie, full)).toBe(57);
  });

  it("reports the lowest possible price", () => {
    expect(fromPrice(hoodie)).toBe(45);
  });

  it("formats whole dollars without cents", () => {
    expect(formatPrice(45)).toBe("$45");
    expect(formatPrice(45.5)).toBe("$45.50");
  });
});

describe("required options and sold-out combinations", () => {
  it("lists required groups that still need a choice", () => {
    expect(missingGroups(hoodie, initialSelection(hoodie))).toEqual(["Size", "Color"]);
    expect(missingGroups(hoodie, full)).toEqual([]);
  });

  it("disables a choice that would complete a sold-out combination", () => {
    expect(wouldBeSoldOut(hoodie, { Size: "XS" }, "Color", "Sand")).toBe(true);
    expect(wouldBeSoldOut(hoodie, { Size: "L" }, "Color", "Sand")).toBe(false);
    expect(wouldBeSoldOut(hoodie, {}, "Color", "Sand")).toBe(false);
  });
});

describe("zeffyOrder", () => {
  it("maps priced choices to Zeffy items and add-ons, the rest to options", () => {
    expect(zeffyOrder(hoodie, full)).toEqual({
      item: "Hoodie - Big Logo",
      options: [
        { name: "Back Design", label: "With Back Design" },
        { name: "Size", label: "L" },
        { name: "Color", label: "Burgundy" },
      ],
      addOns: ["Personalization On Sleeve/item"],
      total: 57,
    });
  });

  it("adds nothing for an add-on group set to its free choice", () => {
    expect(zeffyOrder(hoodie, { ...full, "Sleeve personalization": "None" }).addOns).toEqual([]);
  });
});

describe("zeffyEmbedUrl", () => {
  it("switches a form URL to its English embed", () => {
    expect(zeffyEmbedUrl("https://www.zeffy.com/en-CA/ticketing/merch-fall-2026")).toBe(
      "https://www.zeffy.com/en-CA/embed/ticketing/merch-fall-2026",
    );
    expect(zeffyEmbedUrl("https://www.zeffy.com/fr-CA/ticketing/merch")).toBe(
      "https://www.zeffy.com/en-CA/embed/ticketing/merch",
    );
  });
});
