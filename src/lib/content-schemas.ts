import { z } from "astro/zod";

/**
 * Content schemas, kept free of `astro:content` so unit tests can validate
 * fixtures directly. Collections that hold images take Astro's `image()`
 * helper; tests pass a string schema instead.
 */
type ImageSchema<I extends z.ZodType> = () => I;

const draft = z.boolean().default(false);

// Quoted in YAML ("2026-11-27") so it stays a calendar day, not a UTC timestamp.
const isoDay = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "dates must look like 2026-11-27");

export const eventSchema = <I extends z.ZodType>(image: ImageSchema<I>) =>
  z
    .object({
      title: z.string().min(1),
      /** Exact date and time, once confirmed. */
      start: z.coerce.date().optional(),
      end: z.coerce.date().optional(),
      /** "YYYY-MM-DD" when the day is set but not the time. */
      date: isoDay.optional(),
      /** "YYYY-MM-DD", last day of a multi-day `date` event. */
      endDate: isoDay.optional(),
      /** "YYYY-MM" while only the month is planned. */
      month: z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month must look like 2026-12")
        .optional(),
      /** Still being decided; shown with a "tentative" label. */
      tentative: z.boolean().default(false),
      location: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      image: image().optional(),
      rsvpUrl: z.url().optional(),
      /** Index in events.yaml, added by the loader; breaks ties within a month. */
      position: z.number().int().default(0),
      draft,
    })
    .refine((e) => [e.start, e.date, e.month].filter((v) => v !== undefined).length === 1, {
      message: "set exactly one of start (date and time), date (YYYY-MM-DD) or month (YYYY-MM)",
      path: ["start"],
    })
    .refine((e) => !e.end || (e.start !== undefined && e.end >= e.start), {
      message: "end needs a start, and must be on or after it",
      path: ["end"],
    })
    .refine((e) => !e.endDate || (e.date !== undefined && e.endDate >= e.date), {
      message: "endDate needs a date, and must be on or after it",
      path: ["endDate"],
    });

export const teamSchema = <I extends z.ZodType>(image: ImageSchema<I>) =>
  z.object({
    name: z.string().min(1),
    role: z.string().min(1).optional(),
    /** Id of the committee this person belongs to (see committees.yaml). */
    committee: z.string().optional(),
    photo: image(),
    order: z.number().int().default(100),
    draft,
  });

export const committeeSchema = <I extends z.ZodType>(image: ImageSchema<I>) =>
  z.object({
    name: z.string().min(1),
    photo: image(),
    order: z.number().int().default(100),
    draft,
  });

export const SPONSOR_TIERS = ["title", "gold", "silver", "bronze", "partner"] as const;

export const sponsorSchema = <I extends z.ZodType>(image: ImageSchema<I>) =>
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

export const productSchema = <I extends z.ZodType>(image: ImageSchema<I>) =>
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
