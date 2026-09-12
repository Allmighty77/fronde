import type { MassPreset, SceneDef } from "./types";

/** Softened gravity constant — tuned so a star-planet pair at ~200u orbits in ~12s. */
export const G = 260;

/** Plummer softening (ε²). Prevents singularities without smearing wide orbits. */
export const SOFTEN = 36;

/** Fixed physics step. */
export const DT = 1 / 120;

export const TRAIL_CAP = 160;
export const TRAIL_RECORD_EVERY = 3;
export const MAX_BODIES = 48;
export const CULL_DIST2 = 28_000 * 28_000;
export const SPAWN_GRACE = 0.45;
export const MERGE_FACTOR = 0.9;
export const MIN_ZOOM = 0.14;
export const MAX_ZOOM = 4.8;
export const PREDICT_STEPS = 420;

export const MASS_PRESETS: MassPreset[] = [
  { id: "dust", label: "Poussière", mass: 2.4, color: { r: 186, g: 190, b: 196 } },
  { id: "moon", label: "Lune", mass: 22, color: { r: 206, g: 204, b: 196 } },
  { id: "planet", label: "Planète", mass: 140, color: { r: 168, g: 186, b: 198 } },
  { id: "giant", label: "Géante", mass: 720, color: { r: 176, g: 168, b: 150 } },
  { id: "star", label: "Étoile", mass: 9000, color: { r: 236, g: 232, b: 218 } },
];

export const SCENES: SceneDef[] = [
  { id: "empty", label: "Vide" },
  { id: "star", label: "Soleil" },
  { id: "binary", label: "Binaire" },
  { id: "eight", label: "Huit" },
  { id: "system", label: "Système" },
];

export const PLANET_COLORS = [
  { r: 176, g: 196, b: 210 },
  { r: 198, g: 186, b: 168 },
  { r: 168, g: 188, b: 178 },
  { r: 210, g: 206, b: 196 },
  { r: 158, g: 174, b: 188 },
  { r: 188, g: 176, b: 160 },
  { r: 164, g: 184, b: 196 },
  { r: 204, g: 198, b: 186 },
];

export function radiusFromMass(mass: number): number {
  return 2.15 + 1.12 * Math.cbrt(mass);
}

export function circularSpeed(centralMass: number, radius: number): number {
  return Math.sqrt((G * centralMass) / Math.max(radius, 1));
}

export function mixRgb(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

export function cssRgb(c: { r: number; g: number; b: number }, a = 1): string {
  return `rgba(${c.r | 0}, ${c.g | 0}, ${c.b | 0}, ${a})`;
}

export function presetById(id: MassPreset["id"]): MassPreset {
  return MASS_PRESETS.find((p) => p.id === id) ?? MASS_PRESETS[2]!;
}
