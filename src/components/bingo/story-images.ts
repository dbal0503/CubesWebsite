import type { CallId } from "../../data/bingo";
import type { CallImages } from "./BingoGrid";

// For stories only: the pictures as plain URLs, since Astro's image service
// doesn't run in Storybook.
const files = import.meta.glob<string>("../../assets/bingo/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

export const STORY_IMAGES: CallImages = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [
    path.split("/").pop()?.replace(".webp", "") as CallId,
    url,
  ]),
);
