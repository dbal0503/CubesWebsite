import type { BingoLetter, CallKind } from "../../data/bingo";

interface Props {
  kind: Extract<CallKind, "song" | "film">;
  class?: string;
  title?: string;
}

/** The PDF's marks: a music note for songs, a clapperboard for films. */
export function KindIcon({ kind, class: className, title }: Props) {
  return (
    <svg
      class={className}
      viewBox="0 0 24 24"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : "true"}
      aria-label={title}
      data-kind={kind}
    >
      {kind === "song" ? (
        <path d="M9 17.5V5.2l11-2.2v11.3a3 3 0 1 1-2-2.83V6.4l-7 1.4v9.7a3 3 0 1 1-2-2.83z" />
      ) : (
        <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm.3-1.9L2.8 5.2a1 1 0 0 1 .7-1.2l14.6-3.9a1 1 0 0 1 1.2.7l.5 1.9zM6.2 5.6l3.4-.9-1.9-2.4-3.4.9zm5.8-1.5 3.4-.9-1.9-2.4-3.4.9z" />
      )}
    </svg>
  );
}

/** Ornament colours per letter: light (highlight), base, dark (shadow), text. */
const ORNAMENTS: Record<BingoLetter, [string, string, string, string]> = {
  B: ["#f07a62", "#c8432f", "#7a1f17", "#fff"],
  I: ["#5fae84", "#1e5a40", "#0d2e20", "#fff"],
  N: ["#ffe7a0", "#e8b23a", "#9c6a14", "#3d2410"],
  G: ["#c0606a", "#7f2a33", "#44121a", "#fff"],
  O: ["#a9cbe6", "#3d6f99", "#1c3956", "#fff"],
};

/** The called letter as a hanging Christmas ornament. */
export function Ornament({ letter, class: className }: { letter: BingoLetter; class?: string }) {
  const [light, base, dark, text] = ORNAMENTS[letter];
  const id = `bh-orn-${letter}`;
  return (
    <svg class={className} viewBox="0 0 100 132" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-ball`} cx="0.36" cy="0.32" r="0.75">
          <stop offset="0" stop-color={light} />
          <stop offset="0.55" stop-color={base} />
          <stop offset="1" stop-color={dark} />
        </radialGradient>
        <linearGradient id={`${id}-cap`} x1="0" x2="1">
          <stop offset="0" stop-color="#a8741a" />
          <stop offset="0.4" stop-color="#ffe7a0" />
          <stop offset="1" stop-color="#b8841f" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="50" cy="80" r="49" />
        </clipPath>
      </defs>
      <circle cx="50" cy="9" r="6.5" fill="none" stroke="#b8841f" stroke-width="3" />
      <rect x="37" y="15" width="26" height="15" rx="3" fill={`url(#${id}-cap)`} />
      <path
        d="M41 15v15M47 15v15M53 15v15M59 15v15"
        stroke="#9c6a14"
        stroke-width="1.2"
        opacity="0.5"
      />
      <circle cx="50" cy="80" r="49" fill={`url(#${id}-ball)`} />
      <g
        clip-path={`url(#${id}-clip)`}
        fill="none"
        stroke="#ffe7a0"
        stroke-width="2.5"
        opacity="0.8"
      >
        <path d="M0 113q12.5 7 25 0t25 0 25 0 25 0" />
        <path d="M0 120q12.5 7 25 0t25 0 25 0 25 0" />
      </g>
      <ellipse
        cx="33"
        cy="56"
        rx="11"
        ry="7"
        fill="#fff"
        opacity="0.35"
        transform="rotate(-35 33 56)"
      />
      <text
        x="50"
        y="78"
        fill={text}
        class="bh-ball-letter"
        text-anchor="middle"
        dominant-baseline="central"
      >
        {letter}
      </text>
    </svg>
  );
}
