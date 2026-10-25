import type { ImageMetadata } from "astro";

/** QB poses by what they show, mapped to the numbered exports in src/assets/qb/. */
export const QB_POSES = {
  cups: 1,
  blueprints: 2,
  dance: 3,
  wreckingBall: 4,
  cupid: 5,
  wheelbarrow: 6,
  climbing: 7,
  parachute: 8,
  waiter: 9,
  microphone: 10,
  wave: 11,
  hoodie: 12,
  thumbsUp: 13,
  laptop: 14,
  pointer: 15,
  lightbulb: 16,
  running: 17,
  group: 18,
  ladder: 19,
  carryingCubes: 20,
  broom: 21,
  plank: 22,
  plant: 23,
  pushingBox: 24,
  baby: 25,
  featherDuster: 26,
  peekingPole: 27,
  peeking: 28,
  car: 29,
  menAtWork: 30,
  walkingAway: 31,
  cowboy: 32,
  shovel: 33,
  pickaxe: 34,
  wrench: 35,
  measuring: 36,
  stopSign: 37,
  boltCutter: 38,
} as const;

export type QbPose = keyof typeof QB_POSES;

const images = import.meta.glob<{ default: ImageMetadata }>("../assets/qb/qb-*.webp", {
  eager: true,
});

export function qbImage(pose: QbPose): ImageMetadata {
  const file = `../assets/qb/qb-${String(QB_POSES[pose]).padStart(2, "0")}.webp`;
  const image = images[file];
  if (!image) throw new Error(`Missing QB pose "${pose}" (${file})`);
  return image.default;
}
