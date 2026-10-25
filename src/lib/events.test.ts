import { describe, expect, it } from "vitest";
import {
  deserializeEvent,
  formatMonth,
  formatWhen,
  isPast,
  monthKey,
  nextEvent,
  serializeEvent,
  type TimedEvent,
  upcomingEvents,
} from "./events";

const at = (iso: string) => new Date(iso);
const dated = (id: string, start: string, extra: Partial<TimedEvent> = {}): TimedEvent => ({
  id,
  title: id,
  start: at(start),
  ...extra,
});
const monthly = (id: string, month: string, extra: Partial<TimedEvent> = {}): TimedEvent => ({
  id,
  title: id,
  month,
  ...extra,
});

describe("isPast", () => {
  const now = at("2026-11-20T21:00:00-05:00");

  it("keeps an event without an end current for the rest of its day", () => {
    expect(isPast(dated("tonight", "2026-11-20T18:00:00-05:00"), now)).toBe(false);
    expect(isPast(dated("yesterday", "2026-11-19T18:00:00-05:00"), now)).toBe(true);
  });

  it("keeps a multi-day event current until it ends", () => {
    const engweek = dated("engweek", "2026-11-16T09:00:00-05:00", {
      end: at("2026-11-22T17:00:00-05:00"),
    });
    expect(isPast(engweek, now)).toBe(false);
    expect(isPast(engweek, at("2026-11-22T18:00:00-05:00"))).toBe(true);
  });

  it("keeps a month-only event current through its month", () => {
    expect(isPast(monthly("this-month", "2026-11"), now)).toBe(false);
    expect(isPast(monthly("last-month", "2026-10"), now)).toBe(true);
  });

  it("uses Montreal time, not UTC, at month boundaries", () => {
    // 9 p.m. on Nov 30 in Montreal is already December in UTC.
    const lateNov = at("2026-11-30T21:00:00-05:00");
    expect(monthKey(lateNov)).toBe("2026-11");
    expect(isPast(monthly("november", "2026-11"), lateNov)).toBe(false);
  });
});

describe("upcomingEvents and nextEvent", () => {
  const now = at("2026-11-05T12:00:00-05:00");
  const events = [
    monthly("cubesmas", "2026-12"),
    monthly("workshop", "2026-11", { tentative: true }),
    dated("asp", "2026-11-14T09:00:00-05:00", { tentative: true }),
    monthly("wine-and-cheese", "2026-10"),
    dated("talk", "2026-11-28T18:00:00-05:00"),
    monthly("gingerbread", "2026-12", { tentative: true }),
  ];

  it("drops past events and sorts dated before month-only within a month", () => {
    expect(upcomingEvents(events, now).map((e) => e.id)).toEqual([
      "asp",
      "talk",
      "workshop",
      "cubesmas",
      "gingerbread",
    ]);
  });

  it("keeps file order for month-only events in the same month", () => {
    const october = [
      monthly("open-house", "2026-11", { position: 2 }),
      monthly("wine-and-cheese", "2026-11", { position: 1 }),
    ];
    expect(nextEvent(october, now)?.id).toBe("wine-and-cheese");
  });

  it("prefers the next confirmed event over an earlier tentative one", () => {
    expect(nextEvent(events, now)?.id).toBe("talk");
  });

  it("falls back to a tentative event when nothing is confirmed", () => {
    const onlyMaybes = [monthly("site-tour", "2027-03", { tentative: true })];
    expect(nextEvent(onlyMaybes, now)?.id).toBe("site-tour");
  });

  it("returns undefined when every event is over", () => {
    expect(nextEvent([monthly("old", "2026-09")], now)).toBeUndefined();
  });
});

describe("formatting", () => {
  it("labels month-only events as date TBA", () => {
    expect(formatMonth("2026-12")).toBe("December 2026");
    expect(formatWhen(monthly("cubesmas", "2026-12"))).toBe("December 2026 · date TBA");
  });

  it("shows the Montreal day and time for dated events", () => {
    expect(formatWhen(dated("talk", "2026-11-20T23:00:00Z"))).toMatch(/^Fri, Nov\.? 20 · 6:00/);
  });

  it("round-trips through JSON for client scripts", () => {
    const event = dated("talk", "2026-11-20T23:00:00Z", { tentative: true });
    const back = deserializeEvent(JSON.parse(JSON.stringify(serializeEvent(event))));
    expect(back).toEqual({ ...event, end: undefined, month: undefined });
  });
});
