#!/usr/bin/env node
// Regenerates the web-sized masters in src/assets/ from the originals on the
// CUBES shared Google Drive. Download the Drive folder, then run:
//
//   pnpm export-masters [path-to-drive-folder]   (default: ./assets)
//
// Expected layout of the Drive folder (folder names are matched case-insensitively):
//   Chosen pictures/*.jpg   team photos   -> src/assets/photos/img-0406.jpg
//   Cubes Design/<n>.png    QB poses      -> src/assets/qb/qb-01.webp
//   cubeslogo.png           logo          -> src/assets/brand/cubes-logo.png
//                           cube mark     -> public/favicon-*.png, public/apple-touch-icon.png

import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PHOTO_MAX_PX = 2000;
const PHOTO_QUALITY = 85;
const QB_MAX_PX = 1000;
const LOGO_MAX_PX = 1200;

const root = path.resolve(process.argv[2] ?? "assets");
const out = path.resolve("src/assets");
const publicDir = path.resolve("public");

async function findEntry(dir, name) {
  const entries = await readdir(dir);
  const match = entries.find((e) => e.toLowerCase() === name.toLowerCase());
  if (!match) throw new Error(`"${name}" not found in ${dir}`);
  return path.join(dir, match);
}

async function listFiles(dir, extensions) {
  const entries = await readdir(dir);
  return entries.filter((e) => extensions.includes(path.extname(e).toLowerCase())).sort();
}

async function exportPhotos() {
  const src = await findEntry(root, "Chosen pictures");
  const dest = path.join(out, "photos");
  await mkdir(dest, { recursive: true });

  const files = await listFiles(src, [".jpg", ".jpeg"]);
  for (const file of files) {
    const name = `${path.parse(file).name.toLowerCase().replace(/_/g, "-")}.jpg`;
    // rotate() applies the EXIF orientation; sharp drops the rest of the
    // metadata (camera, GPS) unless asked to keep it.
    await sharp(path.join(src, file))
      .rotate()
      .resize(PHOTO_MAX_PX, PHOTO_MAX_PX, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: PHOTO_QUALITY, mozjpeg: true })
      .toFile(path.join(dest, name));
  }
  return files.length;
}

async function exportQbPoses() {
  const src = await findEntry(root, "Cubes Design");
  const dest = path.join(out, "qb");
  await mkdir(dest, { recursive: true });

  const files = await listFiles(src, [".png"]);
  for (const file of files) {
    const pose = path.parse(file).name.padStart(2, "0");
    await sharp(path.join(src, file))
      .trim()
      .resize(QB_MAX_PX, QB_MAX_PX, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(path.join(dest, `qb-${pose}.webp`));
  }
  return files.length;
}

async function exportLogo() {
  const src = await findEntry(root, "cubeslogo.png");
  const dest = path.join(out, "brand");
  await mkdir(dest, { recursive: true });

  await sharp(src)
    .trim()
    .resize(LOGO_MAX_PX, LOGO_MAX_PX, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(path.join(dest, "cubes-logo.png"));
}

// The cube mark without the "CUBES" wordmark, which is unreadable at favicon
// sizes. The mark ends at the tallest band of empty rows above the wordmark.
async function logoMark() {
  const src = await findEntry(root, "cubeslogo.png");
  const trimmed = await sharp(src).trim().png().toBuffer();
  const { data, info } = await sharp(trimmed)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const isBlankRow = (y) => {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      const white = data[i] > 230 && data[i + 1] > 230 && data[i + 2] > 230;
      if (data[i + 3] > 40 && !white) return false;
    }
    return true;
  };

  let best = { start: info.height, length: 0 };
  let start = -1;
  for (let y = 0; y <= info.height; y++) {
    const blank = y < info.height && isBlankRow(y);
    if (blank && start < 0) start = y;
    if (!blank && start >= 0) {
      if (y - start > best.length) best = { start, length: y - start };
      start = -1;
    }
  }

  return sharp(trimmed)
    .extract({ left: 0, top: 0, width: info.width, height: best.start })
    .trim()
    .png()
    .toBuffer();
}

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function icon(mark, size, { background = TRANSPARENT, fill = 0.94 } = {}) {
  // At tab sizes the mark's tapered strokes fade to a few faint pixels, so small
  // icons get their stroke opacity boosted.
  const inner = Math.round(size * fill);
  let resized = sharp(mark).resize(inner, inner, { fit: "contain", background: TRANSPARENT });
  if (size <= 48) resized = resized.ensureAlpha().linear([1, 1, 1, 2.5], [0, 0, 0, 0]);

  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: await resized.png().toBuffer(), gravity: "center" }])
    .png({ compressionLevel: 9 });
}

async function exportFavicons() {
  await mkdir(publicDir, { recursive: true });
  const mark = await logoMark();

  await (await icon(mark, 32)).toFile(path.join(publicDir, "favicon-32.png"));
  await (await icon(mark, 192)).toFile(path.join(publicDir, "favicon-192.png"));
  // iOS renders transparency as black, so the home-screen icon gets a white backing.
  await (await icon(mark, 180, { background: "#ffffff", fill: 0.78 })).toFile(
    path.join(publicDir, "apple-touch-icon.png"),
  );
}

const photos = await exportPhotos();
const poses = await exportQbPoses();
await exportLogo();
await exportFavicons();
console.log(`Exported ${photos} photos, ${poses} QB poses, the logo and favicons`);
