// Christmas accessories for QB poses, drawn in each pose's own pixel
// coordinates. Layers paint in order; see make-bingo-art.mjs.

import { CW, dot, facetedStar, line } from "./draw.mjs";

/** A flopping hat over QB's hard hat: crown, trim band, then the tip. */
const hat = ({ body, band, crease, tip, cw }) => [
  { art: `<path d="${body}"/>`, cuts: line(crease, cw) },
  { art: line(band, 64) },
  tip,
];

/** A wire through the points with a bulb hanging between each pair. */
function lights(points) {
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
    art += `<rect x="${bx - 10}" y="${by - 6}" width="20" height="18" rx="4"/><ellipse cx="${bx}" cy="${by + 34}" rx="19" ry="28"/>`;
    cuts += line(`M${bx - 7},${by + 24} Q${bx - 8},${by + 36} ${bx - 4},${by + 46}`, 6);
  });
  return { art, cuts };
}

function mug(x, y) {
  return {
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
      crease: "M560,-60 C640,0 690,110 690,230",
      cw: CW / 1.25,
      tip: { art: dot(905, 20, 58), cuts: line("M875,10 Q880,-10 900,-18", 8) },
    }),
  },
  "elf-cubie": {
    pose: 3,
    pad: { top: 250, left: 60 },
    scale: 1.25,
    layers: hat({
      body: "M205,128 C215,10 350,-80 500,-50 C600,-30 650,90 575,245 Z M290,60 C270,-40 200,-95 110,-100 C200,-150 360,-140 480,-50 Z",
      band: "M200,128 Q380,160 568,242",
      crease: "M430,-40 C500,20 540,110 530,195",
      cw: CW / 1.25,
      tip: {
        art: dot(105, -95, 40),
        cuts: line("M78,-88 L132,-88", 8) + dot(105, -72, 7),
      },
    }),
  },
  "skater-cubie": {
    pose: 17,
    pad: { bottom: 60, right: 60 },
    layers: [
      {
        art: `<path d="M380,505 C450,540 500,580 535,650 L480,680 C455,610 420,570 360,540 Z"/>${line("M105,500 Q240,545 395,500", 62)}`,
        cuts:
          line("M165,490 L170,550 M225,500 L229,562 M290,505 L292,566 M350,497 L351,558", CW) +
          line("M455,615 L512,583 M478,662 L530,632", CW),
      },
      {
        art:
          line("M120,1012 L290,1012 Q315,1012 312,990", 20) +
          line("M165,990 L165,1010 M255,994 L255,1010", 16) +
          line("M495,990 L605,990 Q628,990 625,968", 20) +
          line("M525,962 L525,988 M575,966 L575,988", 16),
      },
    ],
  },
  "snowball-cubie": {
    pose: 4,
    pad: { left: 60, right: 60, bottom: 20 },
    layers: [
      {
        art: dot(400, 770, 22) + dot(445, 860, 15) + dot(395, 935, 11) + dot(-20, 700, 14),
        // A snowflake cut into the wrecking ball.
        cuts: [0, 60, 120]
          .map(
            (a) =>
              `<g transform="rotate(${a} 160 880)">${line("M160,795 L160,965 M160,820 L135,800 M160,820 L185,800 M160,940 L135,960 M160,940 L185,960", CW)}</g>`,
          )
          .join(""),
      },
    ],
  },
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
      lights([
        [0, 345],
        [90, 395],
        [180, 430],
        [270, 470],
        [360, 520],
      ]),
      lights([
        [620, 455],
        [710, 490],
        [800, 505],
        [890, 530],
        [985, 560],
      ]),
    ],
  },
  "angel-cubie": {
    pose: 5,
    pad: { top: 140, left: 40 },
    layers: [
      {
        art: `<ellipse cx="500" cy="-55" rx="175" ry="42" fill="none" stroke="currentColor" stroke-width="32"/>`,
      },
      facetedStar(30, 520, 82),
    ],
  },
  "candy-cane-cubie": {
    pose: 15,
    pad: { top: 120, left: 60 },
    layers: [
      {
        art: line("M90,440 L-5,215 C-40,130 30,60 100,100 C140,125 145,175 120,200", 46),
        cuts: `<path d="M90,440 L-5,215 C-40,130 30,60 100,100 C140,125 145,175 120,200" fill="none" stroke="currentColor" stroke-width="60" stroke-dasharray="${CW} 34" stroke-linecap="butt"/>`,
      },
    ],
  },
  "hot-cocoa-cubie": {
    pose: 9,
    pad: { top: 120, left: 20 },
    layers: [
      mug(30, 240),
      mug(160, 250),
      {
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
      // Ribbons around each box: front face, then the top box's side face.
      {
        art:
          line("M85,100 L85,238 M0,168 L170,168 L362,86 M268,50 L268,190", 24) +
          line("M135,262 L135,425 M0,350 L272,350", 24),
      },
      {
        art: `<path d="M85,88 C30,10 -25,60 70,96 Z M85,88 C140,10 195,60 100,96 Z"/>${dot(85, 90, 22)}`,
        cuts: line("M65,70 C50,55 35,50 28,58 M105,70 C120,55 135,50 142,58", 8),
      },
    ],
  },
  "reindeer-cubie": {
    pose: 13,
    pad: { top: 260, left: 40, right: 80 },
    layers: [
      {
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
      { art: dot(352, 345, 32), cuts: dot(340, 333, 8) },
    ],
  },
};
