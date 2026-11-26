import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  BINGO_CALLS,
  BINGO_LETTERS,
  BINGO_MEDIA,
  type BingoCall,
  type CallId,
} from "../../data/bingo";
import {
  BINGO_LINES,
  CARD_COUNT,
  checkCard,
  drawCall,
  formatCardNumber,
  getCall,
} from "../../lib/bingo";
import BingoGrid, { type CallImages } from "./BingoGrid";
import { KindIcon, Ornament } from "./icons";
import { readStored, writeStored } from "./storage";
import "./bingo.css";

interface Props {
  /** Pictures for the Cubie and word calls. */
  images: CallImages;
  /** Shown before the first call. */
  idleImage: string;
  backUrl: string;
}

const STORAGE_KEY = "cubes-bingo-host";
const ROLL_TICKS = 12;
const ROLL_MS = 70;
const RECENT = 4;

const isCallId = (id: unknown): id is CallId => typeof id === "string" && !!getCall(id);

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && !!target.closest("input, textarea, select, dialog");
}

export default function BingoHost({ images, idleImage, backUrl }: Props) {
  const [called, setCalled] = useState<CallId[]>([]);
  const [rolling, setRolling] = useState<BingoCall | null>(null);
  const [playing, setPlaying] = useState(false);
  const [checkNumber, setCheckNumber] = useState("");
  const [checked, setChecked] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Set once the keyboard shortcuts are listening (tests wait for it).
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const saved = readStored<unknown[]>(STORAGE_KEY);
    if (Array.isArray(saved)) setCalled([...new Set(saved.filter(isCallId))]);
    const onFullscreen = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.clearInterval(timer.current);
    };
  }, []);

  const save = (next: CallId[]) => {
    setCalled(next);
    writeStored(STORAGE_KEY, next);
  };

  const current = called.length > 0 ? getCall(called[called.length - 1]) : undefined;
  const media = !rolling && current ? BINGO_MEDIA[current.id as CallId] : undefined;
  const remaining = BINGO_CALLS.length - called.length;

  const draw = () => {
    if (rolling) return;
    const next = drawCall(called);
    if (!next) return;
    setPlaying(false);
    if (prefersReducedMotion()) {
      save([...called, next]);
      return;
    }
    let ticks = 0;
    timer.current = window.setInterval(() => {
      ticks += 1;
      if (ticks >= ROLL_TICKS) {
        window.clearInterval(timer.current);
        setRolling(null);
        save([...called, next]);
        return;
      }
      setRolling(BINGO_CALLS[Math.floor(Math.random() * BINGO_CALLS.length)]);
    }, ROLL_MS);
  };

  const undo = () => {
    if (rolling || called.length === 0) return;
    setPlaying(false);
    save(called.slice(0, -1));
  };

  const newGame = () => {
    if (rolling) return;
    if (called.length === 0 || window.confirm("Start a new game? This clears every call so far.")) {
      setPlaying(false);
      save([]);
    }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else rootRef.current?.requestFullscreen?.();
  };

  const togglePlay = () => {
    if (media) setPlaying(!playing);
  };

  // Keyboard shortcuts, so the host can run the game from a keyboard or clicker.
  const actions = useRef({ draw, undo, togglePlay, toggleFullscreen });
  actions.current = { draw, undo, togglePlay, toggleFullscreen };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const a = actions.current;
      if (e.key === " " || e.key === "ArrowRight" || e.key === "PageDown") {
        // Space on a focused button already clicks it.
        if (e.key === " " && e.target instanceof HTMLButtonElement) return;
        e.preventDefault();
        a.draw();
      } else if (e.key === "p" || e.key === "P") a.togglePlay();
      else if (e.key === "u" || e.key === "U") a.undo();
      else if (e.key === "f" || e.key === "F") a.toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    setReady(true);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openCheck = (event: Event) => {
    event.preventDefault();
    const n = Number(checkNumber);
    if (!Number.isInteger(n) || n < 1 || n > CARD_COUNT) return;
    setChecked(n);
    dialogRef.current?.showModal();
  };

  const result = checked === null ? undefined : checkCard(checked, called);
  const winning = useMemo(
    () =>
      new Set(BINGO_LINES.filter((l) => result?.lines.includes(l.name)).flatMap((l) => l.squares)),
    [result?.lines.join()],
  );

  const shown = rolling ?? current;
  const before = rolling ? called : called.slice(0, -1);
  const recent = before
    .slice(-RECENT)
    .reverse()
    .map((id) => getCall(id))
    .filter((c): c is BingoCall => !!c);
  const art = shown ? images[shown.id as CallId] : idleImage;

  return (
    <div class="bh" ref={rootRef} data-ready={ready || undefined}>
      <header class="bh-top">
        <p class="bh-title">
          Cubesmas Bingo <span>with Cubie</span>
        </p>
        <p class="bh-count">
          <strong>{called.length}</strong> of {BINGO_CALLS.length} called
        </p>
      </header>

      <section class="bh-stage" aria-labelledby="bh-now-title">
        <h2 id="bh-now-title" class="visually-hidden">
          Now calling
        </h2>
        <div class="bh-call">
          <div class="bh-call-main" data-rolling={rolling ? "" : undefined} aria-live="polite">
            {shown ? (
              <>
                <Ornament letter={shown.letter} class="bh-ball" key={`ball-${shown.id}`} />
                <p
                  class="bh-label"
                  data-long={shown.label.length > 13 || undefined}
                  key={`label-${shown.id}`}
                >
                  {!rolling && <span class="visually-hidden">{shown.letter}, </span>}
                  {shown.label}
                </p>
              </>
            ) : (
              <p class="bh-label bh-idle">
                Ready when you are
                <span>Press Draw or the space bar for the first call.</span>
              </p>
            )}
          </div>

          {/* Always laid out (hidden without a clip) so the call above never moves. */}
          <button
            type="button"
            class="bh-play"
            onClick={togglePlay}
            aria-keyshortcuts="P"
            disabled={!media}
            data-hidden={!media || undefined}
          >
            {playing ? "■ Stop" : current?.kind === "song" ? "▶ Play the song" : "▶ Play the clip"}
          </button>
        </div>

        <div class="bh-art">
          {media && playing ? (
            <div class="bh-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${media.youtubeId}?start=${media.start}&end=${media.end}&autoplay=1&rel=0&playsinline=1`}
                title={`${current?.label}: ${media.credit}`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
              <p class="bh-credit">
                {media.credit} ·{" "}
                <a
                  href={`https://www.youtube.com/watch?v=${media.youtubeId}&t=${media.start}s`}
                  target="_blank"
                  rel="noopener"
                >
                  Open on YouTube
                </a>
              </p>
            </div>
          ) : art ? (
            <img class="bh-picture" src={art} alt="" key={art} />
          ) : shown && (shown.kind === "song" || shown.kind === "film") ? (
            <div class="bh-kind" key={shown.id}>
              <KindIcon kind={shown.kind} />
              <p>{shown.kind === "song" ? "Hum along!" : "Quote the movie!"}</p>
            </div>
          ) : null}
        </div>

        {/* Its own row with fixed slots, so new calls shift it along without moving it. */}
        <div class="bh-recent" data-empty={recent.length === 0 || undefined}>
          <span class="bh-recent-title">Before that</span>
          <ol>
            {recent.map((c) => (
              <li key={c.id}>
                <b>{c.letter}</b> {c.label}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section class="bh-board" aria-label="Called so far">
        {BINGO_LETTERS.map((letter) => (
          <div class="bh-row" key={letter}>
            <span class="bh-row-letter" aria-hidden="true">
              {letter}
            </span>
            <ul aria-label={`${letter} calls`}>
              {BINGO_CALLS.filter((c) => c.letter === letter).map((c) => {
                const isCalled = called.includes(c.id);
                return (
                  <li
                    key={c.id}
                    class={[
                      isCalled && "is-called",
                      c.id === current?.id && !rolling && "is-latest",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {c.label}
                    {isCalled && <span class="visually-hidden"> (called)</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <footer class="bh-controls">
        <button
          type="button"
          class="bh-btn bh-draw"
          onClick={draw}
          disabled={remaining === 0 || !!rolling}
          aria-keyshortcuts="Space ArrowRight PageDown"
        >
          {remaining === 0 ? "All called" : called.length === 0 ? "Draw first call" : "Draw next"}
        </button>
        <button
          type="button"
          class="bh-btn"
          onClick={undo}
          disabled={called.length === 0 || !!rolling}
          aria-keyshortcuts="U"
        >
          Undo
        </button>
        <button type="button" class="bh-btn" onClick={newGame}>
          New game
        </button>
        <button type="button" class="bh-btn" onClick={toggleFullscreen} aria-keyshortcuts="F">
          {isFullscreen ? "Exit full screen" : "Full screen"}
        </button>

        <form class="bh-check" onSubmit={openCheck}>
          <label for="bh-check-number">Check a card</label>
          <span aria-hidden="true">#</span>
          <input
            id="bh-check-number"
            type="number"
            inputMode="numeric"
            min={1}
            max={CARD_COUNT}
            required
            placeholder={`1–${CARD_COUNT}`}
            value={checkNumber}
            onInput={(e) => setCheckNumber((e.target as HTMLInputElement).value)}
          />
          <button type="submit" class="bh-btn bh-btn-gold">
            Check
          </button>
        </form>

        <a class="bh-back" href={backUrl}>
          Exit
        </a>
      </footer>

      <dialog
        ref={dialogRef}
        class="bingo-dialog"
        aria-labelledby="bingo-dialog-title"
        onClose={() => setChecked(null)}
      >
        {checked !== null && result && (
          <>
            <h2 id="bingo-dialog-title" data-win={result.lines.length > 0 || undefined}>
              Card {formatCardNumber(checked)}: {result.lines.length > 0 ? "BINGO!" : "not yet"}
            </h2>
            <p class="bingo-dialog-verdict">
              {result.lines.length > 0
                ? `${result.lines.join(", ")}: every square on it has been called.`
                : "No line is fully called yet. Circled squares have been called."}
            </p>
            <BingoGrid
              squares={result.card}
              cubies={images}
              called={(sq) => result.calledSquares[sq] ?? false}
              winning={winning}
            />
            <form method="dialog">
              <button type="submit" class="button button-primary">
                Close
              </button>
            </form>
          </>
        )}
      </dialog>
    </div>
  );
}
