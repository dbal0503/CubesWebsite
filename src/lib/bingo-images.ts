import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";
import { BINGO_CALLS, type CallId } from "../data/bingo";

const images = import.meta.glob<{ default: ImageMetadata }>("../assets/bingo/*.webp", {
  eager: true,
});

/** Calls with a picture: the Christmas Cubies and the plain words. Songs and films use icons. */
export const PICTURED_CALLS = BINGO_CALLS.filter((c) => c.kind === "cubie" || c.kind === "word");

export function callImage(id: CallId): ImageMetadata {
  const image = images[`../assets/bingo/${id}.webp`];
  if (!image) throw new Error(`Missing Bingo picture for "${id}" in src/assets/bingo/`);
  return image.default;
}

/** Optimized URLs for every pictured call, for the Preact islands, which can't use <Image>. */
export async function callImageUrls(width: number): Promise<Partial<Record<CallId, string>>> {
  const entries = await Promise.all(
    PICTURED_CALLS.map(async (c) => {
      const { src } = await getImage({ src: callImage(c.id), width, format: "webp" });
      return [c.id, src] as const;
    }),
  );
  return Object.fromEntries(entries);
}
