import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import {
  eventSchema,
  faqSchema,
  productSchema,
  sponsorSchema,
  teamSchema,
} from "./lib/content-schemas";

const events = defineCollection({
  loader: file("src/content/events.yaml"),
  schema: ({ image }) => eventSchema(image),
});

const team = defineCollection({
  loader: file("src/content/team.yaml"),
  schema: ({ image }) => teamSchema(image),
});

const sponsors = defineCollection({
  loader: file("src/content/sponsors.yaml"),
  schema: ({ image }) => sponsorSchema(image),
});

const products = defineCollection({
  loader: glob({ pattern: "*.md", base: "src/content/products" }),
  schema: ({ image }) => productSchema(image),
});

const faq = defineCollection({
  loader: glob({ pattern: "*.md", base: "src/content/faq" }),
  schema: faqSchema,
});

export const collections = { events, team, sponsors, products, faq };
