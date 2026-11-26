// Drawing helpers for the Christmas Bingo art, in QB's style: one flat ink
// colour, with details cut out as transparent lines.

export const INK = "#782020";

/** Width of a cut line, matching the gaps in QB's line art. */
export const CW = 13;

/** A stroked ink line (in `art`) or a cut line (in `cuts`). */
export const line = (d, w = CW) =>
  `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}"/>`;

export const dot = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;

export function star(cx, cy, r, inner = 0.45) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * inner : r;
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return pts;
}

export const polygon = (pts) =>
  `<polygon points="${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}"/>`;

/** A star with facet lines from its centre to each inner corner. */
export function facetedStar(cx, cy, r) {
  const pts = star(cx, cy, r, 0.48);
  return {
    art: `${polygon(pts)}${polygon(pts).replace("/>", ` fill="none" stroke="currentColor" stroke-width="${r * 0.12}"/>`)}`,
    cuts: pts
      .filter((_, i) => i % 2)
      .map(([x, y]) =>
        line(`M${cx},${cy} L${x.toFixed(1)},${y.toFixed(1)}`, Math.min(CW, r * 0.09)),
      )
      .join(""),
  };
}

/** A four-point sparkle. */
export const sparkle = (cx, cy, r) =>
  `<path d="M${cx},${cy - r} Q${cx + r * 0.18},${cy - r * 0.18} ${cx + r},${cy} Q${cx + r * 0.18},${cy + r * 0.18} ${cx},${cy + r} Q${cx - r * 0.18},${cy + r * 0.18} ${cx - r},${cy} Q${cx - r * 0.18},${cy - r * 0.18} ${cx},${cy - r} Z"/>`;

/** A wavy line from x1 to x2 at y. */
export function wave(x1, x2, y, amp = 18, step = 60) {
  let d = `M${x1},${y}`;
  for (let x = x1, up = true; x < x2; x += step, up = !up) {
    d += ` Q${x + step / 2},${y + (up ? -amp : amp)} ${Math.min(x + step, x2)},${y}`;
  }
  return d;
}
