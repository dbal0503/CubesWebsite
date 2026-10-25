import type { CollectionEntry } from "astro:content";
import type { TimedEvent } from "./events";

export function toTimedEvent(entry: CollectionEntry<"events">): TimedEvent {
  const { title, start, end, date, endDate, month, tentative, position } = entry.data;
  return { id: entry.id, title, start, end, date, endDate, month, tentative, position };
}
