import type { FontId, Settings } from "./types";

export interface Face {
  id: Exclude<FontId, "random">;
  label: string;
  stack: string;
}

export const FACES: readonly Face[] = [
  { id: "lato", label: "Lato", stack: '"Lato", "Helvetica Neue", sans-serif' },
  { id: "arial", label: "Arial", stack: 'Arial, "Helvetica Neue", sans-serif' },
  { id: "system", label: "System", stack: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
  { id: "serif", label: "Serif", stack: '"Literata", "Iowan Old Style", Palatino, Georgia, serif' },
];

export interface RandomFace {
  name: string;
  stack: string;
}

export const RANDOM_FACES: readonly RandomFace[] = [
  { name: "Fraunces", stack: '"Fraunces", Georgia, serif' },
  { name: "Newsreader", stack: '"Newsreader", Georgia, serif' },
  { name: "Nunito", stack: '"Nunito", "Helvetica Neue", sans-serif' },
  { name: "Caveat", stack: '"Caveat", cursive' },
  { name: "IBM Plex Mono", stack: '"IBM Plex Mono", ui-monospace, monospace' },
];

export function randomStack(name: string): string {
  return RANDOM_FACES.find((face) => face.name === name)?.stack ?? RANDOM_FACES[0].stack;
}

export function writingStack(settings: Settings): string {
  if (settings.font === "random") return randomStack(settings.randomFamily);
  return FACES.find((face) => face.id === settings.font)?.stack ?? FACES[0].stack;
}

export function nextRandomFamily(current: string): string {
  const pool = RANDOM_FACES.filter((face) => face.name !== current);
  const choice = pool[Math.floor(Math.random() * pool.length)] ?? RANDOM_FACES[0];
  return choice.name;
}
