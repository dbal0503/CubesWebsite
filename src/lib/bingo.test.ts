import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BINGO_CALLS, BINGO_CARDS, BINGO_LETTERS, BINGO_MEDIA } from "../data/bingo";
import {
  BINGO_LINES,
  CARD_COUNT,
  checkCard,
  completedLines,
  drawCall,
  FREE_SQUARE,
  formatCardNumber,
  getCall,
} from "./bingo";

describe("bingo data matches the printed cards", () => {
  it("has 30 cards of 25 squares with the free square in the middle", () => {
    expect(CARD_COUNT).toBe(30);
    for (const card of BINGO_CARDS) {
      expect(card).toHaveLength(25);
      expect(card.indexOf(null)).toBe(FREE_SQUARE);
      expect(card.filter((sq) => sq === null)).toHaveLength(1);
    }
  });

  it("only puts each column's calls under its letter, with no repeats on a card", () => {
    BINGO_CARDS.forEach((card, i) => {
      const ids = card.filter((sq) => sq !== null);
      expect(new Set(ids).size, `card ${i + 1}`).toBe(24);
      card.forEach((id, sq) => {
        if (id === null) return;
        expect(getCall(id)?.letter, `card ${i + 1} square ${sq}`).toBe(BINGO_LETTERS[sq % 5]);
      });
    });
  });

  it("gives every card 5 Cubie squares, as the PDF's rules promise", () => {
    for (const card of BINGO_CARDS) {
      expect(card.filter((id) => id && getCall(id)?.kind === "cubie")).toHaveLength(5);
    }
  });

  it("has unique call ids, and media only for songs and films", () => {
    expect(new Set(BINGO_CALLS.map((c) => c.id)).size).toBe(BINGO_CALLS.length);
    for (const id of Object.keys(BINGO_MEDIA)) {
      expect(["song", "film"]).toContain(getCall(id)?.kind);
    }
  });

  it("has a picture for every Cubie and word call", () => {
    const missing = BINGO_CALLS.filter(
      (c) =>
        (c.kind === "cubie" || c.kind === "word") &&
        !existsSync(new URL(`../assets/bingo/${c.id}.webp`, import.meta.url)),
    ).map((c) => c.id);
    expect(missing).toEqual([]);
  });

  it("gives every song and film a clip that ends after it starts", () => {
    for (const call of BINGO_CALLS.filter((c) => c.kind === "song" || c.kind === "film")) {
      const media = BINGO_MEDIA[call.id];
      expect(media, call.id).toBeDefined();
      expect(media?.youtubeId).toMatch(/^[\w-]{11}$/);
      expect(media?.end).toBeGreaterThan(media?.start ?? Infinity);
    }
  });
});

describe("completedLines", () => {
  it("knows all 12 lines", () => {
    expect(BINGO_LINES).toHaveLength(12);
  });

  it("finds nothing on an empty card", () => {
    expect(completedLines(() => false)).toEqual([]);
  });

  it("counts the free square toward its row, column and both diagonals", () => {
    const marked = new Set([10, 11, 13, 14]);
    expect(completedLines((sq) => marked.has(sq))).toEqual(["Row 3"]);
    const diagonal = new Set([4, 8, 16, 20]);
    expect(completedLines((sq) => diagonal.has(sq))).toEqual(["Diagonal ↙"]);
  });

  it("finds a column", () => {
    const marked = new Set([0, 5, 10, 15, 20]);
    expect(completedLines((sq) => marked.has(sq))).toEqual(["Column B"]);
  });
});

describe("checkCard", () => {
  it("confirms a BINGO only from squares that were called", () => {
    const card1Row1 = ["sleigh", "winter-wonderland", "mistletoe", "gingerbread", "last-christmas"];
    expect(checkCard(1, card1Row1)?.lines).toEqual(["Row 1"]);
    expect(checkCard(1, card1Row1.slice(0, 4))?.lines).toEqual([]);
    expect(checkCard(2, card1Row1)?.lines).toEqual([]);
  });

  it("rejects card numbers that don't exist", () => {
    expect(checkCard(0, [])).toBeUndefined();
    expect(checkCard(31, [])).toBeUndefined();
    expect(checkCard(1.5, [])).toBeUndefined();
  });
});

describe("drawCall", () => {
  it("never repeats a call and runs out after the last one", () => {
    const called: string[] = [];
    for (let i = 0; i < BINGO_CALLS.length; i++) {
      const next = drawCall(called);
      expect(next).toBeDefined();
      expect(called).not.toContain(next);
      called.push(next as string);
    }
    expect(drawCall(called)).toBeUndefined();
  });

  it("uses the random source it's given", () => {
    expect(drawCall([], () => 0)).toBe(BINGO_CALLS[0].id);
    expect(drawCall([], () => 0.999)).toBe(BINGO_CALLS.at(-1)?.id);
  });
});

it("pads card numbers like the PDF", () => {
  expect(formatCardNumber(7)).toBe("#07");
  expect(formatCardNumber(30)).toBe("#30");
});
