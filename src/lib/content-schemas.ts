import { z } from "astro/zod";

/**
 * Content schemas, kept free of `astro:content` so unit tests can validate
 * fixtures directly. Collections that hold images take Astro's `image()`
 * helper; tests pass a string schema instead.
 */
type ImageSchema = () => z.ZodType;

const draft = z.boolean().default(false);

export const eventSchema = (image: ImageSchema) =>
  z
    .object({
      title: z.string().min(1),
      start: z.coerce.date(),
      end: z.coerce.date().optional(),
      location: z.string().min(1),
      description: z.string().min(1),
      image: image().optional(),
      rsvpUrl: z.url().optional(),
      draft,
    })
    .refine((e) => !e.end || e.end >= e.start, {
      message: "end must be on or after start",
      path: ["end"],
    });

export const teamSchema = (image: ImageSchema) =>
  z.object({
    name: z.string().min(1),
    role: z.string().min(1),
    photo: image(),
    order: z.number().int(),
    draft,
  });

export const SPONSOR_TIERS = ["title", "gold", "silver", "bronze", "partner"] as const;

export const sponsorSchema = (image: ImageSchema) =>
  z.object({
    name: z.string().min(1),
    logo: image(),
    url: z.url(),
    tier: z.enum(SPONSOR_TIERS),
    active: z.boolean().default(true),
    draft,
  });

const choiceSchema = z.object({
  label: z.string().min(1),
  priceDelta: z.number().default(0),
  /** CSS colour for colour swatches. */
  swatch: z.string().optional(),
  /** Picking this choice selects this Zeffy item (Zeffy options can't change prices). */
  zeffyItem: z.string().optional(),
  /** Picking this choice adds this Zeffy add-on item to the order. */
  zeffyAddOn: z.string().optional(),
});

const optionGroupSchema = z.object({
  name: z.string().min(1),
  required: z.boolean().default(true),
  choices: z.array(choiceSchema).min(1),
});

export const productSchema = (image: ImageSchema) =>
  z
    .object({
      name: z.string().min(1),
      photos: z.array(image()).min(1),
      basePrice: z.number().positive(),
      optionGroups: z.array(optionGroupSchema).default([]),
      /** Combinations that can't be bought, e.g. `{ Size: "XS", Color: "Sand" }`. */
      soldOut: z.array(z.record(z.string(), z.string())).default([]),
      zeffy: z.object({
        formUrl: z.url(),
        /** Fixed Zeffy item, when no option group picks one. */
        item: z.string().optional(),
      }),
      fulfilment: z.string().min(1),
      /** Last date someone confirmed the Zeffy form's prices match this entry. */
      zeffyPricesCheckedAt: z.coerce.date(),
      order: z.number().int().default(0),
      active: z.boolean().default(true),
      draft,
    })
    .superRefine((product, ctx) => {
      const groups = new Map(product.optionGroups.map((g) => [g.name, g]));

      if (groups.size !== product.optionGroups.length) {
        ctx.addIssue({
          code: "custom",
          message: "option group names must be unique",
          path: ["optionGroups"],
        });
      }
      product.optionGroups.forEach((group, i) => {
        const labels = new Set(group.choices.map((c) => c.label));
        if (labels.size !== group.choices.length) {
          ctx.addIssue({
            code: "custom",
            message: `choice labels in "${group.name}" must be unique`,
            path: ["optionGroups", i, "choices"],
          });
        }
      });

      product.soldOut.forEach((combo, i) => {
        for (const [groupName, label] of Object.entries(combo)) {
          const group = groups.get(groupName);
          if (!group?.choices.some((c) => c.label === label)) {
            ctx.addIssue({
              code: "custom",
              message: `soldOut refers to unknown option "${groupName}: ${label}"`,
              path: ["soldOut", i],
            });
          }
        }
      });

      const itemGroups = product.optionGroups.filter((g) => g.choices.some((c) => c.zeffyItem));
      const everyChoiceMapped = itemGroups.every((g) => g.choices.every((c) => c.zeffyItem));
      const resolvable = product.zeffy.item
        ? itemGroups.length === 0
        : itemGroups.length === 1 && everyChoiceMapped;
      if (!resolvable) {
        ctx.addIssue({
          code: "custom",
          message:
            "every selection must map to exactly one Zeffy item: set zeffy.item, or give every choice in exactly one option group a zeffyItem",
          path: ["zeffy"],
        });
      }
    });

export const faqSchema = z.object({
  question: z.string().min(1),
  /** Extra words that should match this answer in the chat. */
  keywords: z.array(z.string()).default([]),
  /** Shown as a suggestion chip when the chat opens. */
  suggested: z.boolean().default(false),
  order: z.number().int().default(0),
  sources: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
  /** Answer computed at runtime instead of from the body. */
  dynamic: z.enum(["nextEvent"]).optional(),
  /** False until a CUBES exec has checked the answer against its sources. */
  reviewed: z.boolean().default(false),
  draft,
});
