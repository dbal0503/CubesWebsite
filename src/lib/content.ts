import { type CollectionEntry, type CollectionKey, getCollection } from "astro:content";

/** Drafts show up in `pnpm dev` so they can be previewed, and never in a build. */
export function shouldPublish(entry: { draft?: boolean }, isDev: boolean): boolean {
  return isDev || !entry.draft;
}

export async function getPublished<C extends CollectionKey>(
  collection: C,
): Promise<CollectionEntry<C>[]> {
  return getCollection(collection, (entry) =>
    shouldPublish(entry.data as { draft?: boolean }, import.meta.env.DEV),
  );
}
