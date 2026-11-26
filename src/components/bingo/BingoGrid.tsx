import { BINGO_LETTERS, type CallId } from "../../data/bingo";
import { FREE_SQUARE, getCall } from "../../lib/bingo";
import { KindIcon } from "./icons";

export type CallImages = Partial<Record<CallId, string>>;

interface Props {
  squares: readonly (CallId | null)[];
  cubies: CallImages;
  /** Squares that have been called; the rest are dimmed. */
  called: (square: number) => boolean;
  /** Squares on a completed line, highlighted. */
  winning: ReadonlySet<number>;
}

/** A printed card as the host sees it when checking a BINGO. */
export default function BingoGrid({ squares, cubies, called, winning }: Props) {
  return (
    <div class="bingo-grid">
      {BINGO_LETTERS.map((letter) => (
        <div class="bingo-grid-letter" key={letter} aria-hidden="true">
          {letter}
        </div>
      ))}
      {squares.map((id, sq) => {
        const call = id ? getCall(id) : undefined;
        const isFree = sq === FREE_SQUARE;
        const isCalled = isFree || called(sq);
        const label = isFree ? "Free" : (call?.label ?? "");
        const className = [
          "bingo-square",
          `is-${isFree ? "free" : (call?.kind ?? "word")}`,
          isCalled && "is-marked",
          winning.has(sq) && "is-winning",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={sq}
            class={className}
            role="img"
            aria-label={`${BINGO_LETTERS[sq % 5]} ${label}${isCalled && !isFree ? ", called" : ""}`}
          >
            {isFree ? (
              <svg class="bingo-star" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z" />
              </svg>
            ) : call?.kind === "cubie" && id && cubies[id] ? (
              <img class="bingo-cubie" src={cubies[id]} alt="" loading="lazy" />
            ) : null}
            <span class="bingo-square-label">{label}</span>
            {call && call.kind !== "cubie" && call.kind !== "word" && (
              <KindIcon kind={call.kind} class="bingo-kind" />
            )}
            {isCalled && !isFree && <span class="bingo-chip" aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
}
