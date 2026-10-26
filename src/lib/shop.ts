/**
 * Shop rules: prices, sold-out combinations, and translating a selection into
 * what the buyer must pick on Zeffy. Zeffy options can't change prices, so
 * priced choices map to separate Zeffy items (`zeffyItem`) or add-ons
 * (`zeffyAddOn`); everything else is a plain Zeffy option.
 */

export interface Choice {
  label: string;
  priceDelta: number;
  swatch?: string;
  zeffyItem?: string;
  zeffyAddOn?: string;
}

export interface OptionGroup {
  name: string;
  required: boolean;
  preselect: boolean;
  choices: Choice[];
}

export interface ShopProduct {
  name: string;
  basePrice: number;
  optionGroups: OptionGroup[];
  soldOut: Record<string, string>[];
  zeffy: { formUrl: string; item?: string };
}

/** Option group name → chosen label. */
export type Selection = Record<string, string>;

export function initialSelection(product: ShopProduct, params?: URLSearchParams): Selection {
  const selection: Selection = {};
  for (const group of product.optionGroups) {
    const fromUrl = params?.get(group.name);
    const valid = group.choices.find((c) => c.label === fromUrl);
    if (valid && !wouldBeSoldOut(product, selection, group.name, valid.label)) {
      selection[group.name] = valid.label;
    } else if (group.preselect) {
      const first = group.choices.find(
        (c) => !wouldBeSoldOut(product, selection, group.name, c.label),
      );
      if (first) selection[group.name] = first.label;
    }
  }
  return selection;
}

export function selectionToParams(selection: Selection): URLSearchParams {
  return new URLSearchParams(Object.entries(selection));
}

function chosen(product: ShopProduct, selection: Selection): Choice[] {
  return product.optionGroups.flatMap((group) => {
    const choice = group.choices.find((c) => c.label === selection[group.name]);
    return choice ? [choice] : [];
  });
}

export function totalPrice(product: ShopProduct, selection: Selection): number {
  return chosen(product, selection).reduce((sum, c) => sum + c.priceDelta, product.basePrice);
}

/** Lowest possible price, for "From $40" on the listing. */
export function fromPrice(product: ShopProduct): number {
  return product.optionGroups.reduce(
    (sum, group) => sum + Math.min(...group.choices.map((c) => c.priceDelta)),
    product.basePrice,
  );
}

export function missingGroups(product: ShopProduct, selection: Selection): string[] {
  return product.optionGroups.filter((g) => g.required && !selection[g.name]).map((g) => g.name);
}

const matches = (combo: Record<string, string>, selection: Selection) =>
  Object.entries(combo).every(([group, label]) => selection[group] === label);

export function isSoldOut(product: ShopProduct, selection: Selection): boolean {
  return product.soldOut.some((combo) => matches(combo, selection));
}

/**
 * Whether picking `label` in `group` would complete a sold-out combination,
 * given everything else already selected. Used to disable choices.
 */
export function wouldBeSoldOut(
  product: ShopProduct,
  selection: Selection,
  group: string,
  label: string,
): boolean {
  return isSoldOut(product, { ...selection, [group]: label });
}

export interface ZeffyOrder {
  /** The Zeffy item to add to the cart. */
  item: string;
  /** Zeffy options to pick on that item, in form order. */
  options: { name: string; label: string }[];
  /** Zeffy add-on items to add, one of each. */
  addOns: string[];
  total: number;
}

export function zeffyOrder(product: ShopProduct, selection: Selection): ZeffyOrder {
  let item = product.zeffy.item;
  const options: ZeffyOrder["options"] = [];
  const addOns: string[] = [];

  for (const group of product.optionGroups) {
    const choice = group.choices.find((c) => c.label === selection[group.name]);
    if (!choice) continue;
    if (choice.zeffyItem) item = choice.zeffyItem;
    else if (choice.zeffyAddOn) addOns.push(choice.zeffyAddOn);
    else if (!group.choices.some((c) => c.zeffyItem || c.zeffyAddOn)) {
      options.push({ name: group.name, label: choice.label });
    }
  }

  if (!item) throw new Error(`No Zeffy item for ${product.name} with this selection`);
  return { item, options, addOns, total: totalPrice(product, selection) };
}

/** Zeffy's embeddable version of a form URL, pinned to English. */
export function zeffyEmbedUrl(formUrl: string): string {
  const url = new URL(formUrl);
  const path = url.pathname.replace(/^\/[a-z]{2}-[A-Z]{2}(?=\/)/, "");
  url.pathname = `/en-CA/embed${path}`;
  return url.toString();
}

const cad = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

/** "$45" for whole dollars, "$45.50" otherwise. */
export function formatPrice(amount: number): string {
  return Number.isInteger(amount) ? cad.format(amount).replace(/\.00$/, "") : cad.format(amount);
}
