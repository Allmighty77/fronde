import {
  MAX_BODIES,
  MAX_ZOOM,
  MIN_ZOOM,
  PLANET_COLORS,
  PREDICT_STEPS,
  SPAWN_GRACE,
  presetById,
} from "./constants";
import { barycenter, createBody, predictPath, stepBodies } from "./physics";
import { worldOf } from "./camera";

import { buildScene } from "./scenes";
import type { Body, Camera, MassKind, MergeEvent, Particle, SceneId } from "./types";

export interface AimState {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  path: Float32Array | null;
}

const LAUNCH_SCALE = 1.15;

export class World {
  bodies: Body[] = [];
  particles: Particle[] = [];
  camera: Camera = { x: 0, y: 0, zoom: 1, panX: 0, panY: 0 };
  trauma = 0;
  planetTint = 0;
  reducedMotion = false;

  constructor() {
    this.load("system");
  }

  load(scene: SceneId) {
    this.bodies = buildScene(scene);
    this.particles = [];
    this.trauma = 0;
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.panX = 0;
    this.camera.panY = 0;
    this.camera.zoom = scene === "eight" ? 1.15 : scene === "empty" ? 1 : 0.92;
  }

  clear() {
    this.bodies = [];
    this.particles = [];
    this.trauma = 0;
  }

  spawn(kind: MassKind, x: number, y: number, vx: number, vy: number) {
    if (this.bodies.length >= MAX_BODIES) return null;
    const preset = presetById(kind);
    const color =
      kind === "planet" || kind === "giant"
        ? PLANET_COLORS[this.planetTint++ % PLANET_COLORS.length]!
        : preset.color;
    const body = createBody({
      x,
      y,
      vx,
      vy,
      mass: preset.mass,
      color,
      kind,
      grace: SPAWN_GRACE,
    });
    this.bodies.push(body);
    return body;
  }

  velocityFromDrag(dx: number, dy: number) {
    return { vx: dx * LAUNCH_SCALE, vy: dy * LAUNCH_SCALE };
  }

  predict(kind: MassKind, x: number, y: number, vx: number, vy: number) {
    const preset = presetById(kind);
    return predictPath(
      this.bodies,
      { x, y, vx, vy, mass: preset.mass, color: preset.color, kind },
      PREDICT_STEPS,
    );
  }

  step(dt: number, trails: boolean): MergeEvent[] {
    const events: MergeEvent[] = [];
    this.bodies = stepBodies(this.bodies, dt, {
      trails,
      events,
      cull: true,
    });
    this.stepParticles(dt);
    for (const e of events) this.burst(e);
    return events;
  }

  followCamera(dt: number, follow: boolean) {
    if (!follow || this.bodies.length === 0) {
      this.camera.x +=
        (this.camera.panX - this.camera.x) * (1 - Math.exp(-3.2 * dt));
      this.camera.y +=
        (this.camera.panY - this.camera.y) * (1 - Math.exp(-3.2 * dt));
      return;
    }
    const com = barycenter(this.bodies);
    const tx = com.x + this.camera.panX;
    const ty = com.y + this.camera.panY;
    const k = 1 - Math.exp(-3.2 * dt);
    this.camera.x += (tx - this.camera.x) * k;
    this.camera.y += (ty - this.camera.y) * k;
  }

  addPan(dx: number, dy: number) {
    this.camera.panX += dx;
    this.camera.panY += dy;
  }

  zoomAt(screenX: number, screenY: number, w: number, h: number, factor: number) {
    const before = worldOf(screenX, screenY, this.camera, w, h);
    this.camera.zoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, this.camera.zoom * factor),
    );
    const after = worldOf(screenX, screenY, this.camera, w, h);
    const dx = before.x - after.x;
    const dy = before.y - after.y;
    this.camera.x += dx;
    this.camera.y += dy;
    this.camera.panX += dx;
    this.camera.panY += dy;
  }

  resetView() {
    this.camera.panX = 0;
    this.camera.panY = 0;
    this.camera.zoom = 1;
  }

  addTrauma(amount: number) {
    if (this.reducedMotion) return;
    this.trauma = Math.min(1, this.trauma + amount);
  }

  decayTrauma(dt: number) {
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
  }

  private burst(e: MergeEvent) {
    const n = Math.min(28, 8 + Math.floor(Math.sqrt(e.mass) * 0.35));
    for (let i = 0; i < n; i++) {
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const sp = 18 + Math.random() * 90;
      this.particles.push({
        x: e.x,
        y: e.y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0.35 + Math.random() * 0.45,
        max: 0.7,
        size: 1.2 + Math.random() * 2.4,
        color: e.color,
      });
    }
    this.addTrauma(Math.min(0.55, 0.12 + Math.sqrt(e.mass) / 180));
  }

  private stepParticles(dt: number) {
    const next: Particle[] = [];
    for (const p of this.particles) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      next.push(p);
    }
    this.particles = next;
  }
}

export { LAUNCH_SCALE };
