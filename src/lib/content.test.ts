import { describe, expect, it, vi } from "vitest";

vi.mock("astro:content", () => ({ getCollection: vi.fn() }));

const { shouldPublish } = await import("./content");

describe("shouldPublish", () => {
  it("hides drafts from production builds", () => {
    expect(shouldPublish({ draft: true }, false)).toBe(false);
    expect(shouldPublish({ draft: false }, false)).toBe(true);
    expect(shouldPublish({}, false)).toBe(true);
  });

  it("shows drafts in dev so they can be previewed", () => {
    expect(shouldPublish({ draft: true }, true)).toBe(true);
  });
});
