// Christmas accessories for QB poses, drawn in each pose's own pixel
// coordinates. Layers paint in order; see make-bingo-art.mjs.

import {
  BLUE,
  BROWN,
  CW,
  dot,
  facetedStar,
  GOLD,
  GREEN,
  INK,
  line,
  PINE,
  RED,
  SNOW,
  SNOW_SHADE,
  STEEL,
  WHITE,
} from "./draw.mjs";

// Accessories are QB's flat style in Christmas colours (from draw.mjs).

/** A flopping hat over QB's hard hat: crown (one or more shapes), trim band, then the tip. */
const hat = ({ body, band, bandWidth, color, trim, tip, outline = 0 }) => [
  {
    art: [body]
      .flat()
      .map((d) => `<path d="${d}"/>`)
      .join(""),
    color,
  },
  {
    // A thin ink outline keeps white trim visible on a cream background.
    art:
      (outline ? line(band, bandWidth + outline * 2).replace("currentColor", INK) : "") +
      line(band, bandWidth),
    color: trim,
  },
  tip,
];
/**
 * A red band from `a` to `b` (the brim line) with a zigzag top edge and a
 * small gold bell on each inner point.
 */
function elfBand([ax, ay], [bx, by], teeth = 3) {
  const len = Math.hypot(bx - ax, by - ay);
  const [dx, dy] = [(bx - ax) / len, (by - ay) / len];
  const [nx, ny] = [dy, -dx]; // up, away from the face
  const at = (t, up) => [ax + dx * t + nx * up, ay + dy * t + ny * up];
  const top = [];
  for (let k = 0; k <= teeth * 2; k++) top.push(at((len * k) / (teeth * 2), k % 2 ? 42 : 100));
  const edge = [at(len, -28), at(0, -28)];
  const points = [...top, ...edge].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const bells = top
    .filter((_, k) => k % 2 === 0 && k > 0 && k < teeth * 2)
    .map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="20" fill="${GOLD}"/>`)
    .join("");
  return {
    color: RED,
    art: `<polygon points="${points}" stroke="currentColor" stroke-width="12"/>${bells}`,
  };
}

/** A wire through the points with a coloured bulb hanging between each pair. */
function lights(points, offset = 0) {
  const colors = [RED, GOLD, GREEN, BLUE];
  const wire = points
    .map(([x, y], i) => {
      if (i === 0) return `M${x},${y}`;
      const [px, py] = points[i - 1];
      return `Q${(px + x) / 2},${(py + y) / 2 + 32} ${x},${y}`;
    })
    .join(" ");
  let art = line(wire, 12);
  let cuts = "";
  points.forEach(([x, y], i) => {
    const [px, py] = points[Math.max(0, i - 1)];
    const bx = i === 0 ? x : (px + x) / 2;
    const by = i === 0 ? y + 30 : (py + y) / 2 + 40;
    const bulb = colors[(i + offset) % colors.length];
    art += `<rect x="${bx - 10}" y="${by - 6}" width="20" height="18" rx="4"/><ellipse cx="${bx}" cy="${by + 34}" rx="19" ry="28" fill="${bulb}"/>`;
    cuts += line(`M${bx - 7},${by + 24} Q${bx - 8},${by + 36} ${bx - 4},${by + 46}`, 6);
  });
  return { art, cuts, color: PINE };
}

function mug(x, y, color) {
  return {
    color,
    art: `<path d="M${x},${y} L${x + 80},${y} L${x + 74},${y + 112} Q${x + 72},${y + 122} ${x + 62},${y + 122} L${x + 18},${y + 122} Q${x + 8},${y + 122} ${x + 6},${y + 112} Z"/>${line(`M${x + 78},${y + 30} C${x + 118},${y + 30} ${x + 118},${y + 85} ${x + 76},${y + 85}`, 18)}`,
    cuts: line(`M${x + 6},${y + 20} L${x + 74},${y + 20}`, 8),
  };
}

export const CUBIES = {
  "santa-cubie": {
    pose: 11,
    pad: { top: 230, right: 340 },
    scale: 1.25,
    layers: hat({
      body: "M285,175 C300,40 420,-90 600,-120 C720,-140 840,-90 900,10 C860,-20 800,-30 770,0 C800,120 790,240 760,320 Z",
      band: "M275,185 Q500,215 745,330",
      bandWidth: 64,
      color: RED,
      trim: WHITE,
      outline: 7,
      tip: {
        art: `<circle cx="905" cy="20" r="65" fill="${INK}"/>${dot(905, 20, 58)}`,
        color: WHITE,
      },
    }),
  },
  // A felt elf hat, drawn in the pose's own pixels: the green crown covers
  // the hard hat and curls over the front with a bell on the tip, and the red
  // band follows the brim (just above both eyes) with a zigzag top edge.
  "elf-cubie": {
    pose: 3,
    pad: { top: 380, left: 40 },
    layers: [
      {
        color: GREEN,
        art: [
          "M300,172 C310,40 430,-30 560,-28 C700,-25 805,60 815,170 C820,230 813,270 805,300 Z",
          "M805,300 C822,150 800,0 742,-130 C690,-240 600,-325 480,-335 C380,-340 300,-285 270,-195 C256,-150 256,-112 268,-85 C298,-125 330,-182 382,-200 C440,-220 472,-150 452,-60 C442,-20 380,40 300,172 Z",
        ]
          .map((d) => `<path d="${d}"/>`)
          .join(""),
      },
      elfBand([298, 166], [790, 300]),
      {
        color: GOLD,
        art: `${dot(268, -62, 38)}<circle cx="268" cy="-48" r="9" fill="#b9862a"/>`,
        cuts: line("M240,-68 L296,-68", 8),
      },
    ],
  },
  "skater-cubie": {
    pose: 17,
    pad: { bottom: 80, right: 60 },
    layers: [
      {
        color: RED,
        art: `<path d="M380,505 C450,540 500,580 535,650 L480,680 C455,610 420,570 360,540 Z"/>${line("M105,500 Q240,545 395,500", 62)}`,
        cuts:
          line("M165,490 L170,550 M225,500 L229,562 M290,505 L292,566 M350,497 L351,558", CW) +
          line("M455,615 L512,583 M478,662 L530,632", CW),
      },
      // Skates painted behind the boots, so the posts tuck under the soles.
      {
        behind: true,
        color: STEEL,
        art:
          line("M214,1037 L84,930 Q54,905 78,881", 20) +
          line("M180,880 L119,959 M236,926 L175,1005", 16) +
          line("M605,1003 L492,1003 Q462,1003 466,976", 20) +
          line("M528,900 L528,1003 M566,900 L566,1003", 16),
      },
    ],
  },
  "snowball-cubie": {
    pose: 4,
    pad: { left: 60, right: 60, bottom: 20 },
    layers: [
      // The whole wrecking ball repainted as snow, keeping QB's outline and gaps.
      {
        clip: { seed: [165, 900] },
        color: SNOW,
        art: `<rect x="-60" y="600" width="460" height="440"/><path d="M265,760 C345,840 335,960 225,1010 L400,1010 L400,700 Z" fill="${SNOW_SHADE}"/>`,
      },
      {
        color: SNOW_SHADE,
        art: dot(400, 770, 22) + dot(445, 860, 15) + dot(395, 935, 11) + dot(-20, 700, 14),
        // A snowflake cut into the middle of the ball.
        cuts: [0, 60, 120]
          .map(
            (a) =>
              `<g transform="rotate(${a} 169 850)">${line("M169,780 L169,920 M169,802 L148,785 M169,802 L190,785 M169,898 L148,915 M169,898 L190,915", CW)}</g>`,
          )
          .join(""),
      },
    ],
  },
  // Lights only on the part of the ladder behind him, not across his body.
  "twinkle-lights-cubie": {
    pose: 19,
    pad: { top: 30, bottom: 50, left: 20, right: 20 },
    layers: [
      lights([
        [55, 175],
        [140, 215],
        [230, 230],
        [310, 265],
        [370, 300],
      ]),
      lights(
        [
          [0, 345],
          [90, 395],
          [180, 430],
          [270, 470],
          [360, 520],
        ],
        2,
      ),
    ],
  },
  "angel-cubie": {
    pose: 5,
    pad: { top: 140, left: 70 },
    layers: [
      {
        color: GOLD,
        art: `<ellipse cx="500" cy="-55" rx="175" ry="42" fill="none" stroke="currentColor" stroke-width="32"/>`,
      },
      // The heart arrowhead is erased, then a star takes its place.
      {
        ...facetedStar(40, 560, 88, -90),
        color: GOLD,
        erase: `<path d="M-10,490 L100,490 L100,635 L-10,635 Z"/>`,
      },
    ],
  },
  "candy-cane-cubie": {
    pose: 15,
    pad: { top: 120, left: 60 },
    layers: [
      {
        color: RED,
        art: line("M90,440 L-5,215 C-40,130 30,60 100,100 C140,125 145,175 120,200", 46),
        cuts: `<path d="M90,440 L-5,215 C-40,130 30,60 100,100 C140,125 145,175 120,200" fill="none" stroke="currentColor" stroke-width="60" stroke-dasharray="${CW} 34" stroke-linecap="butt"/>`,
      },
    ],
  },
  "hot-cocoa-cubie": {
    pose: 9,
    pad: { top: 120, left: 20 },
    layers: [
      mug(30, 240, RED),
      mug(160, 250, GREEN),
      {
        color: WHITE,
        art: `<rect x="50" y="222" width="18" height="16" rx="4"/><rect x="72" y="226" width="16" height="14" rx="4"/><rect x="185" y="232" width="18" height="16" rx="4"/><rect x="208" y="236" width="16" height="14" rx="4"/>`,
      },
      {
        art: line(
          "M60,205 C40,165 80,145 60,105 M100,200 C80,155 120,135 100,85 M190,210 C170,170 210,150 190,110 M230,205 C210,160 250,140 230,90",
          14,
        ),
      },
    ],
  },
  "gift-wrapped-cubie": {
    pose: 20,
    pad: { top: 110, left: 30 },
    layers: [
      // QB's boxes repainted as presents, keeping his outlines and gaps.
      {
        clip: true,
        color: GREEN,
        art: `<path d="M-5,25 L100,30 L362,5 L368,255 L195,338 L-5,318 Z"/>`,
      },
      {
        clip: true,
        color: GOLD,
        art: `<path d="M-5,330 L170,330 L340,305 L345,500 L195,560 L180,520 L60,520 L-5,545 Z"/>`,
      },
      // A ribbon across the middle of each visible face, both ways.
      {
        color: RED,
        art:
          line("M88,86 L88,306 M8,197 L172,203", 22) +
          line("M270,60 L274,282 M188,208 L356,136", 22) +
          line("M90,370 L90,515 M22,455 L160,462", 22) +
          line("M258,356 L261,520 M183,472 L335,410", 22),
      },
      // The bow on the top box's lid.
      {
        color: RED,
        art: `<path d="M140,62 C95,0 45,35 125,70 Z M140,62 C185,0 235,35 155,70 Z"/>${dot(140, 64, 18)}`,
        cuts: line("M122,47 C110,35 95,30 85,36 M158,47 C170,35 185,30 195,36", 7),
      },
    ],
  },
  "reindeer-cubie": {
    pose: 13,
    pad: { top: 260, left: 40, right: 80 },
    layers: [
      {
        color: BROWN,
        art:
          line(
            "M310,55 C290,-20 250,-90 200,-150 M270,-40 C220,-50 180,-80 160,-120 M232,-105 C248,-155 258,-175 282,-205",
            32,
          ) +
          line(
            "M500,35 C525,-35 565,-100 615,-155 M545,-45 C595,-55 635,-85 655,-125 M585,-110 C570,-160 560,-180 536,-210",
            32,
          ),
      },
      // On the face's centre line, between the eyes and the smile.
      { color: RED, art: dot(338, 338, 34), cuts: dot(326, 326, 8) },
    ],
  },
};
