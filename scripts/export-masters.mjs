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

import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PHOTO_MAX_PX = 2000;
const PHOTO_QUALITY = 85;
const QB_MAX_PX = 1000;
const LOGO_MAX_PX = 1200;

const root = path.resolve(process.argv[2] ?? "assets");
const out = path.resolve("src/assets");

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

const photos = await exportPhotos();
const poses = await exportQbPoses();
await exportLogo();
console.log(`Exported ${photos} photos, ${poses} QB poses and the logo to ${out}`);
