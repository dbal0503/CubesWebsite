/**
 * Event timing rules, shared by the events page, the home page and QB's chat.
 * Everything runs against the visitor's clock (not build time), in Montreal time.
 */

export const TIME_ZONE = "America/Toronto";

export interface TimedEvent {
  id: string;
  title: string;
  start?: Date;
  end?: Date;
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

/** "YYYY-MM-DD" for `date` in Montreal. */
export function dayKey(date: Date): string {
  return dayFormat.format(date);
}

/** "YYYY-MM" for `date` in Montreal. */
export function monthKey(date: Date): string {
  return dayKey(date).slice(0, 7);
}

export function eventMonth(event: TimedEvent): string {
  if (event.month) return event.month;
  if (event.start) return monthKey(event.start);
  throw new Error(`Event "${event.id}" has neither start nor month`);
}

/**
 * Dated events stay current until they end, or until the end of their day
 * when no end is given. Month-only events stay current through their month.
 */
export function isPast(event: TimedEvent, now: Date): boolean {
  if (event.end) return event.end < now;
  if (event.start) return dayKey(event.start) < dayKey(now);
  return eventMonth(event) < monthKey(now);
}

/**
 * Chronological, with month-only events after the dated ones in the same
 * month, tentative events after confirmed ones, then file order.
 */
export function compareEvents(a: TimedEvent, b: TimedEvent): number {
  const byMonth = eventMonth(a).localeCompare(eventMonth(b));
  if (byMonth !== 0) return byMonth;
  if (a.start && b.start) {
    const byTime = a.start.getTime() - b.start.getTime();
    if (byTime !== 0) return byTime;
  } else if (a.start || b.start) {
    return a.start ? -1 : 1;
  }
  return (
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

const monthLabel = new Intl.DateTimeFormat("en-CA", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

/** "December 2026" for "2026-12". */
export function formatMonth(month: string): string {
  return monthLabel.format(new Date(`${month}-15T12:00:00Z`));
}

const dateLabel = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});

const timeLabel = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

/**
 * "Fri, Nov 20 · 6:00 p.m." or "December 2026 · date TBA". Pass
 * `withMonth: false` under a month heading to get just "Date TBA".
 */
export function formatWhen(event: TimedEvent, { withMonth = true } = {}): string {
  if (!event.start) return withMonth ? `${formatMonth(eventMonth(event))} · date TBA` : "Date TBA";
  const day = dateLabel.format(event.start);
  const time = timeLabel.format(event.start);
  const endDay = event.end && dayKey(event.end) !== dayKey(event.start);
  return endDay && event.end ? `${day} – ${dateLabel.format(event.end)}` : `${day} · ${time}`;
}

/** Plain-JSON form for passing events to client scripts. */
export interface SerializedEvent {
  id: string;
  title: string;
  start?: string;
  end?: string;
  month?: string;
  tentative?: boolean;
  position?: number;
}

export function serializeEvent(event: TimedEvent): SerializedEvent {
  return {
    id: event.id,
    title: event.title,
    start: event.start?.toISOString(),
    end: event.end?.toISOString(),
    month: event.month,
    tentative: event.tentative,
    position: event.position,
  };
}

export function deserializeEvent(event: SerializedEvent): TimedEvent {
  return {
    ...event,
    start: event.start ? new Date(event.start) : undefined,
    end: event.end ? new Date(event.end) : undefined,
  };
}
