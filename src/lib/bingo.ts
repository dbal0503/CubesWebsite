import {
  BINGO_CALLS,
  BINGO_CARDS,
  BINGO_LETTERS,
  type BingoCall,
  type CallId,
} from "../data/bingo";

export const CARD_COUNT = BINGO_CARDS.length;
export const FREE_SQUARE = 12;

const range5 = [0, 1, 2, 3, 4];

/** The 12 ways to win: 5 rows, 5 columns, 2 diagonals, as square indexes 0–24. */
export const BINGO_LINES: readonly { name: string; squares: readonly number[] }[] = [
  ...range5.map((r) => ({ name: `Row ${r + 1}`, squares: range5.map((c) => r * 5 + c) })),
  ...range5.map((c) => ({
    name: `Column ${BINGO_LETTERS[c]}`,
    squares: range5.map((r) => r * 5 + c),
  })),
  { name: "Diagonal ↘", squares: range5.map((i) => i * 6) },
  { name: "Diagonal ↙", squares: range5.map((i) => (i + 1) * 4) },
];

const callsById = new Map<string, BingoCall>(BINGO_CALLS.map((c) => [c.id, c]));

export function getCall(id: string): BingoCall | undefined {
  return callsById.get(id);
}

/** Card numbers start at 1, like the printed cards. */
export function getCard(cardNumber: number): readonly (CallId | null)[] | undefined {
  return Number.isInteger(cardNumber) ? BINGO_CARDS[cardNumber - 1] : undefined;
}

export function formatCardNumber(cardNumber: number): string {
  return `#${String(cardNumber).padStart(2, "0")}`;
}

/** Names of the lines where every square is marked. The free square always counts. */
export function completedLines(isMarked: (square: number) => boolean): string[] {
  return BINGO_LINES.filter((line) =>
    line.squares.every((sq) => sq === FREE_SQUARE || isMarked(sq)),
  ).map((line) => line.name);
}

/** Checks a card against the calls made so far, for the host to confirm a BINGO. */
export function checkCard(cardNumber: number, called: readonly string[]) {
  const card = getCard(cardNumber);
  if (!card) return undefined;
  const calledSet = new Set(called);
  const isCalled = (sq: number) => {
    const id = card[sq];
    return id === null || id === undefined ? true : calledSet.has(id);
  };
  return {
    card,
    calledSquares: card.map((_, sq) => isCalled(sq)),
    lines: completedLines(isCalled),
  };
}

/** Picks a call that hasn't come up yet, or undefined once all are called. */
export function drawCall(
  called: readonly string[],
  random: () => number = Math.random,
): CallId | undefined {
  const calledSet = new Set(called);
  const remaining = BINGO_CALLS.filter((c) => !calledSet.has(c.id));
  if (remaining.length === 0) return undefined;
  return remaining[Math.floor(random() * remaining.length)]?.id;
}
