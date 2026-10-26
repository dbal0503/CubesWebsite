/**
 * Event timing rules, shared by the events page, the home page and QB's chat.
 * Everything runs against the visitor's clock (not build time), in Montreal time.
 *
 * An event is known to one of three precisions:
 * - `start` (and optional `end`): exact date and time
 * - `date` (and optional `endDate`): the day, with no time yet
 * - `month`: only the month
 */

export const TIME_ZONE = "America/Toronto";

export interface TimedEvent {
  id: string;
  title: string;
  start?: Date;
  end?: Date;
  /** "YYYY-MM-DD" when the day is known but not the time. */
  date?: string;
  /** "YYYY-MM-DD", last day of a multi-day `date` event. */
  endDate?: string;
  /** "YYYY-MM" when only the month is known. */
  month?: string;
  tentative?: boolean;
  /** Position in the source file; the last tie-breaker. */
  position?: number;
}

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const clockFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "YYYY-MM-DD" for `date` in Montreal. */
export function dayKey(date: Date): string {
  return dayFormat.format(date);
}

/** "YYYY-MM" for `date` in Montreal. */
export function monthKey(date: Date): string {
  return dayKey(date).slice(0, 7);
}

/**
 * Sortable string: "YYYY-MM-DD HH:MM" for timed events, "YYYY-MM-DD ~" for
 * day-only events (after timed ones that day) and "YYYY-MM-~" for month-only
 * events (after everything dated that month).
 */
function sortKey(event: TimedEvent): string {
  if (event.start) return `${dayKey(event.start)} ${clockFormat.format(event.start)}`;
  if (event.date) return `${event.date} ~`;
  if (event.month) return `${event.month}-~`;
  throw new Error(`Event "${event.id}" has no start, date or month`);
}

export function eventMonth(event: TimedEvent): string {
  return sortKey(event).slice(0, 7);
}

/**
 * Timed events stay current until they end, or through their day when no end
 * is given. Day-only events stay current through their last day, month-only
 * events through their month.
 */
export function isPast(event: TimedEvent, now: Date): boolean {
  if (event.end) return event.end < now;
  if (event.start) return dayKey(event.start) < dayKey(now);
  if (event.date) return (event.endDate ?? event.date) < dayKey(now);
  return eventMonth(event) < monthKey(now);
}

// Not localeCompare: collation ignores the punctuation the sort keys rely on.
const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Chronological, then confirmed before tentative, then file order. */
export function compareEvents(a: TimedEvent, b: TimedEvent): number {
  return (
    byCodePoint(sortKey(a), sortKey(b)) ||
    Number(a.tentative ?? false) - Number(b.tentative ?? false) ||
    (a.position ?? 0) - (b.position ?? 0)
  );
}

export function upcomingEvents<E extends TimedEvent>(events: E[], now: Date): E[] {
  return events.filter((e) => !isPast(e, now)).sort(compareEvents);
}

/** The next confirmed event, falling back to the next tentative one. */
export function nextEvent<E extends TimedEvent>(events: E[], now: Date): E | undefined {
  const upcoming = upcomingEvents(events, now);
  return upcoming.find((e) => !e.tentative) ?? upcoming[0];
}

// Calendar dates (no time) are formatted at noon UTC so no time zone shifts the day.
const atNoonUtc = (day: string) => new Date(`${day}T12:00:00Z`);

const monthLabel = new Intl.DateTimeFormat("en-CA", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

/** "December 2026" for "2026-12". */
export function formatMonth(month: string): string {
  return monthLabel.format(atNoonUtc(`${month}-15`));
}

const dayOptions = { weekday: "short", month: "short", day: "numeric" } as const;
const dateLabel = new Intl.DateTimeFormat("en-CA", { ...dayOptions, timeZone: TIME_ZONE });
const calendarDayLabel = new Intl.DateTimeFormat("en-CA", { ...dayOptions, timeZone: "UTC" });

const timeLabel = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

/**
 * "Fri, Nov 20 · 6:00 p.m.", "Sat, Nov 7 – Sun, Nov 8", "Fri, Nov 27" or
 * "December 2026 · date TBA". Pass `withMonth: false` under a month heading
 * to get just "Date TBA".
 */
export function formatWhen(event: TimedEvent, { withMonth = true } = {}): string {
  if (event.start) {
    const day = dateLabel.format(event.start);
    if (event.end && dayKey(event.end) !== dayKey(event.start)) {
      return `${day} – ${dateLabel.format(event.end)}`;
    }
    return `${day} · ${timeLabel.format(event.start)}`;
  }
  if (event.date) {
    const day = calendarDayLabel.format(atNoonUtc(event.date));
    return event.endDate && event.endDate !== event.date
      ? `${day} – ${calendarDayLabel.format(atNoonUtc(event.endDate))}`
      : day;
  }
  return withMonth ? `${formatMonth(eventMonth(event))} · date TBA` : "Date TBA";
}

/** Plain-JSON form for passing events to client scripts. */
export interface SerializedEvent extends Omit<TimedEvent, "start" | "end"> {
  start?: string;
  end?: string;
}

export function serializeEvent(event: TimedEvent): SerializedEvent {
  return {
    ...event,
    start: event.start?.toISOString(),
    end: event.end?.toISOString(),
  };
}

export function deserializeEvent(event: SerializedEvent): TimedEvent {
  return {
    ...event,
    start: event.start ? new Date(event.start) : undefined,
    end: event.end ? new Date(event.end) : undefined,
  };
}
