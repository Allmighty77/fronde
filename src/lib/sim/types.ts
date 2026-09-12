export type MassKind = "dust" | "moon" | "planet" | "giant" | "star";

export type SceneId = "empty" | "star" | "binary" | "eight" | "system";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Body {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  px: number;
  py: number;
  mass: number;
  radius: number;
  color: Rgb;
  kind: MassKind;
  grace: number;
  trail: Float32Array;
  trailHead: number;
  trailCount: number;
  trailStride: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: Rgb;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  panX: number;
  panY: number;
}

export interface MassPreset {
  id: MassKind;
  label: string;
  mass: number;
  color: Rgb;
}

export interface SceneDef {
  id: SceneId;
  label: string;
}

export interface MergeEvent {
  x: number;
  y: number;
  mass: number;
  radius: number;
  color: Rgb;
}
