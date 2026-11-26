// Builds the Cubesmas Bingo pictures in src/assets/bingo/, in QB's style:
// the Christmas Cubies (QB poses from src/assets/qb/ with accessories) and a
// picture for each plain word call. The drawings live in scripts/bingo-art/.
//
//   node scripts/make-bingo-art.mjs [id...] [--debug <dir>]
//
// --debug also writes each result untrimmed, over a 50 px grid labelled in
// the drawing's own coordinates, for placing shapes.
//
// Each picture is a list of layers painted in order. A layer's `art` is
// painted in QB's ink (or its `color`) after a transparent gap is cut around
// it, like the gaps in QB's line art (`gap: false` joins it to what's below
// instead). Then its `cuts` are erased from the result. `erase` removes part
// of the picture before the layer paints. `clip: true` only repaints pixels
// already there, and `clip: { seed: [x, y] }` only the shape at that point
// (recolouring one of QB's shapes, up to its gap lines). `behind: true`
// paints the layer behind what's there, so it can tuck under QB's outline.

import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { CUBIES } from "./bingo-art/cubies.mjs";
import { INK } from "./bingo-art/draw.mjs";
import { WORDS } from "./bingo-art/words.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const qbDir = join(root, "src/assets/qb");
const outDir = join(root, "src/assets/bingo");

const GAP = 13;
const CANVAS = 1000;

const svg = (w, h, pad, body, scale = 1) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><g transform="translate(${pad.left} ${pad.top}) scale(${scale})" fill="currentColor" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`,
  );

async function base(spec) {
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  if (!spec.pose) {
    return sharp({
      create: { width: CANVAS, height: CANVAS, channels: 4, background: transparent },
    })
      .png()
      .toBuffer();
  }
  const file = join(qbDir, `qb-${String(spec.pose).padStart(2, "0")}.webp`);
  return sharp(file)
    .extend({ ...spec.pad, background: transparent })
    .png()
    .toBuffer();
}

const seedAt = ([x, y], pad, scale = 1) => [
  Math.round(pad.left + x * scale),
  Math.round(pad.top + y * scale),
];

/** A mask of the solid shape containing `seed`: a flood fill that stops at QB's gaps. */
async function connectedShape(img, w, h, [sx, sy]) {
  const { data } = await sharp(img).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const solid = (i) => data[i * 4 + 3] > 127;
  const inside = new Uint8Array(w * h);
  const start = sy * w + sx;
  if (!solid(start)) throw new Error(`clip seed (${sx}, ${sy}) isn't on a solid pixel`);
  const stack = [start];
  inside[start] = 1;
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    for (const n of [i - w, i + w, x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1]) {
      if (n >= 0 && n < w * h && !inside[n] && solid(n)) {
        inside[n] = 1;
        stack.push(n);
      }
    }
  }
  const mask = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) mask[i * 4 + 3] = inside[i] ? data[i * 4 + 3] : 0;
  return sharp(mask, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
}

async function build(id, spec) {
  const pad = { top: 0, right: 0, bottom: 0, left: 0, ...spec.pad };
  let img = await base({ ...spec, pad });
  const { width: w, height: h } = await sharp(img).metadata();
  const layer = (body, color, scale = spec.scale) =>
    svg(w, h, pad, `<g color="${color}">${body}</g>`, scale);

  for (const {
    art,
    cuts,
    erase,
    color = INK,
    gap = true,
    clip = false,
    behind = false,
  } of spec.layers) {
    if (erase) {
      img = await sharp(img)
        .composite([{ input: layer(erase, "#000"), blend: "dest-out" }])
        .png()
        .toBuffer();
    }
    let paint = await sharp(layer(art, color)).png().toBuffer();
    if (clip) {
      const shape =
        clip === true ? img : await connectedShape(img, w, h, seedAt(clip.seed, pad, spec.scale));
      paint = await sharp(paint)
        .composite([{ input: shape, blend: "dest-in" }])
        .png()
        .toBuffer();
    }
    const steps = [{ input: paint, blend: behind ? "dest-over" : "over" }];
    if (gap && !clip && !behind) {
      // The gap: the layer's shape grown by GAP px (blur, then a low threshold).
      // Separate pipelines: within one, sharp thresholds before it blurs.
      const blurred = await sharp(paint)
        .extractChannel(3)
        .blur(GAP / 1.9)
        .png()
        .toBuffer();
      const grown = await sharp(blurred).threshold(8).png().toBuffer();
      const mask = await sharp({ create: { width: w, height: h, channels: 3, background: "#000" } })
        .joinChannel(grown)
        .png()
        .toBuffer();
      steps.unshift({ input: mask, blend: "dest-out" });
    }
    if (cuts) steps.push({ input: layer(cuts, "#000"), blend: "dest-out" });
    for (const step of steps) img = await sharp(img).composite([step]).png().toBuffer();
  }

  if (debugDir) {
    let lines = "";
    for (let x = -pad.left - (-pad.left % 50); x <= w; x += 50) {
      const major = x % 100 === 0;
      lines += `<line x1="${x}" y1="${-pad.top}" x2="${x}" y2="${h}" stroke="${major ? "#06c" : "#9cf"}"/>`;
      if (major)
        lines += `<text x="${x + 2}" y="${-pad.top + 14}" font-size="14" fill="#06c" stroke="none">${x}</text>`;
    }
    for (let y = -pad.top - (-pad.top % 50); y <= h; y += 50) {
      const major = y % 100 === 0;
      lines += `<line x1="${-pad.left}" y1="${y}" x2="${w}" y2="${y}" stroke="${major ? "#06c" : "#9cf"}"/>`;
      if (major)
        lines += `<text x="${-pad.left + 2}" y="${y - 2}" font-size="14" fill="#06c" stroke="none">${y}</text>`;
    }
    await sharp({ create: { width: w, height: h, channels: 4, background: "#fff" } })
      .composite([{ input: img }, { input: svg(w, h, pad, lines) }])
      .png()
      .toFile(join(debugDir, `${id}.png`));
  }

  await sharp(img)
    .trim()
    .resize({ width: 600, height: 600, fit: "inside" })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(join(outDir, `${id}.webp`));
}

await mkdir(outDir, { recursive: true });
const args = process.argv.slice(2);
const debugAt = args.indexOf("--debug");
const debugDir = debugAt >= 0 ? args.splice(debugAt, 2)[1] : undefined;
if (debugDir) await mkdir(debugDir, { recursive: true });
const only = args;
const all = {
  ...CUBIES,
  ...Object.fromEntries(Object.entries(WORDS).map(([id, layers]) => [id, { layers }])),
};
for (const [id, spec] of Object.entries(all)) {
  if (only.length && !only.includes(id)) continue;
  await build(id, spec);
  console.log(`✓ ${id}`);
}
