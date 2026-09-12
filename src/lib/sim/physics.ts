import {
  CULL_DIST2,
  DT,
  G,
  MERGE_FACTOR,
  radiusFromMass,
  SOFTEN,
  TRAIL_CAP,
  TRAIL_RECORD_EVERY,
} from "./constants";
import type { Body, MergeEvent, Rgb } from "./types";

let nextId = 1;
let accOldX = new Float64Array(64);
let accOldY = new Float64Array(64);

function ensureAcc(n: number) {
  if (accOldX.length >= n) return;
  const size = Math.max(n * 2, 64);
  accOldX = new Float64Array(size);
  accOldY = new Float64Array(size);
}

export function resetIds() {
  nextId = 1;
}

export function createBody(init: {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  mass: number;
  color: Rgb;
  kind: Body["kind"];
  grace?: number;
}): Body {
  return {
    id: nextId++,
    x: init.x,
    y: init.y,
    vx: init.vx ?? 0,
    vy: init.vy ?? 0,
    ax: 0,
    ay: 0,
    px: init.x,
    py: init.y,
    mass: init.mass,
    radius: radiusFromMass(init.mass),
    color: { ...init.color },
    kind: init.kind,
    grace: init.grace ?? 0,
    trail: new Float32Array(TRAIL_CAP * 2),
    trailHead: 0,
    trailCount: 0,
    trailStride: 0,
  };
}

export function cloneBodyLite(b: Body): Body {
  return {
    ...b,
    color: { ...b.color },
    trail: new Float32Array(0),
    trailHead: 0,
    trailCount: 0,
    trailStride: 0,
  };
}

export function computeAccelerations(bodies: Body[]) {
  const n = bodies.length;
  for (let i = 0; i < n; i++) {
    const bi = bodies[i]!;
    bi.ax = 0;
    bi.ay = 0;
  }
  for (let i = 0; i < n; i++) {
    const a = bodies[i]!;
    for (let j = i + 1; j < n; j++) {
      const b = bodies[j]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const r2 = dx * dx + dy * dy + SOFTEN;
      const inv = 1 / Math.sqrt(r2);
      const inv3 = inv * inv * inv;
      const f = G * inv3;
      const fx = dx * f;
      const fy = dy * f;
      a.ax += fx * b.mass;
      a.ay += fy * b.mass;
      b.ax -= fx * a.mass;
      b.ay -= fy * a.mass;
    }
  }
}

function kindFromMass(mass: number): Body["kind"] {
  if (mass >= 3500) return "star";
  if (mass >= 400) return "giant";
  if (mass >= 70) return "planet";
  if (mass >= 8) return "moon";
  return "dust";
}

function absorb(keep: Body, drop: Body) {
  const m = keep.mass + drop.mass;
  keep.x = (keep.x * keep.mass + drop.x * drop.mass) / m;
  keep.y = (keep.y * keep.mass + drop.y * drop.mass) / m;
  keep.vx = (keep.vx * keep.mass + drop.vx * drop.mass) / m;
  keep.vy = (keep.vy * keep.mass + drop.vy * drop.mass) / m;
  const t = drop.mass / m;
  keep.color.r += (drop.color.r - keep.color.r) * t;
  keep.color.g += (drop.color.g - keep.color.g) * t;
  keep.color.b += (drop.color.b - keep.color.b) * t;
  keep.mass = m;
  keep.radius = radiusFromMass(m);
  keep.kind = kindFromMass(m);
  keep.px = keep.x;
  keep.py = keep.y;
  keep.ax = 0;
  keep.ay = 0;
}

function resolveMerges(bodies: Body[], events: MergeEvent[]): Body[] {
  let list = bodies;
  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < list.length; i++) {
      const a = list[i]!;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j]!;
        if (a.grace > 0 || b.grace > 0) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const r = (a.radius + b.radius) * MERGE_FACTOR;
        if (dx * dx + dy * dy >= r * r) continue;
        const keep = a.mass >= b.mass ? a : b;
        const drop = keep === a ? b : a;
        const mx = (a.x * a.mass + b.x * b.mass) / (a.mass + b.mass);
        const my = (a.y * a.mass + b.y * b.mass) / (a.mass + b.mass);
        absorb(keep, drop);
        events.push({
          x: mx,
          y: my,
          mass: keep.mass,
          radius: keep.radius,
          color: { ...keep.color },
        });
        list = list.filter((body) => body !== drop);
        changed = true;
        break outer;
      }
    }
  }
  return list;
}

function recordTrail(b: Body) {
  b.trailStride++;
  if (b.trailStride < TRAIL_RECORD_EVERY) return;
  b.trailStride = 0;
  const i = b.trailHead * 2;
  b.trail[i] = b.x;
  b.trail[i + 1] = b.y;
  b.trailHead = (b.trailHead + 1) % TRAIL_CAP;
  if (b.trailCount < TRAIL_CAP) b.trailCount++;
}

export function stepBodies(
  bodies: Body[],
  dt: number,
  opts?: { trails?: boolean; events?: MergeEvent[]; cull?: boolean },
): Body[] {
  const n = bodies.length;
  ensureAcc(n);
  const dt2 = dt * dt;

  for (const b of bodies) {
    b.px = b.x;
    b.py = b.y;
    if (b.grace > 0) b.grace = Math.max(0, b.grace - dt);
  }

  computeAccelerations(bodies);

  for (let i = 0; i < n; i++) {
    const b = bodies[i]!;
    accOldX[i] = b.ax;
    accOldY[i] = b.ay;
    b.x += b.vx * dt + 0.5 * b.ax * dt2;
    b.y += b.vy * dt + 0.5 * b.ay * dt2;
  }

  computeAccelerations(bodies);

  for (let i = 0; i < n; i++) {
    const b = bodies[i]!;
    b.vx += 0.5 * (accOldX[i]! + b.ax) * dt;
    b.vy += 0.5 * (accOldY[i]! + b.ay) * dt;
  }

  let next = resolveMerges(bodies, opts?.events ?? []);

  if (opts?.cull) {
    next = next.filter((b) => b.x * b.x + b.y * b.y < CULL_DIST2);
  }

  if (opts?.trails) {
    for (const b of next) recordTrail(b);
  }

  return next;
}

export function barycenter(bodies: Body[]): { x: number; y: number } {
  let m = 0;
  let x = 0;
  let y = 0;
  for (const b of bodies) {
    m += b.mass;
    x += b.x * b.mass;
    y += b.y * b.mass;
  }
  if (m <= 0) return { x: 0, y: 0 };
  return { x: x / m, y: y / m };
}

export function predictPath(
  bodies: Body[],
  draft: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    mass: number;
    color: Rgb;
    kind: Body["kind"];
  },
  steps: number,
): Float32Array {
  const frozen = bodies.length > 14;
  const savedId = nextId;
  const clones: Body[] = bodies.map((b) => cloneBodyLite(b));
  const me = createBody({ ...draft, grace: 0 });
  clones.push(me);
  const path = new Float32Array(steps * 2);
  let count = 0;
  const dt = DT * 2;
  const myId = me.id;

  if (frozen) {
    for (const b of clones) {
      if (b.id !== myId) {
        b.vx = 0;
        b.vy = 0;
      }
    }
  }

  let current = clones;
  for (let i = 0; i < steps; i++) {
    current = stepBodies(current, dt, { trails: false, cull: false });
    const self = current.find((b) => b.id === myId);
    if (!self) break;
    path[count * 2] = self.x;
    path[count * 2 + 1] = self.y;
    count++;
  }

  nextId = savedId;
  const out = new Float32Array(count * 2);
  out.set(path.subarray(0, count * 2));
  return out;
}

export { DT };
