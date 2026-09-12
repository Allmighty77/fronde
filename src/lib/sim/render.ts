import { cssRgb, TRAIL_CAP } from "./constants";
import { screenOf } from "./camera";
import type { AimState } from "./world";
import type { World } from "./world";
import type { Body, Camera } from "./types";

interface Star {
  x: number;
  y: number;
  s: number;
  a: number;
  p: number;
}

const stars: Star[] = Array.from({ length: 160 }, (_, i) => {
  const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  const f = seed - Math.floor(seed);
  const f2 = Math.sin(i * 93.9898) * 23421.3;
  const g = f2 - Math.floor(f2);
  return {
    x: f,
    y: (g + 1) / 2,
    s: 0.4 + (f * 7) % 1.8,
    a: 0.25 + (g % 1) * 0.55,
    p: 0.015 + (f * g) * 0.04,
  };
});

function drawStarfield(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cam: Camera,
) {
  ctx.fillStyle = "#08090b";
  ctx.fillRect(0, 0, w, h);

  const wash = ctx.createRadialGradient(
    w * 0.5,
    h * 0.42,
    20,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.72,
  );
  wash.addColorStop(0, "rgba(18, 20, 28, 0.55)");
  wash.addColorStop(1, "rgba(8, 9, 11, 0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  for (const s of stars) {
    let px = (s.x * w - cam.x * s.p * cam.zoom * 12) % w;
    let py = (s.y * h - cam.y * s.p * cam.zoom * 12) % h;
    if (px < 0) px += w;
    if (py < 0) py += h;
    ctx.fillStyle = `rgba(232, 232, 226, ${s.a})`;
    ctx.beginPath();
    ctx.arc(px, py, s.s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function trailPoint(b: Body, i: number): { x: number; y: number } | null {
  if (i < 0 || i >= b.trailCount) return null;
  const start = (b.trailHead - b.trailCount + TRAIL_CAP) % TRAIL_CAP;
  const idx = (start + i) % TRAIL_CAP;
  return { x: b.trail[idx * 2]!, y: b.trail[idx * 2 + 1]! };
}

function drawTrails(
  ctx: CanvasRenderingContext2D,
  bodies: Body[],
  cam: Camera,
  w: number,
  h: number,
  alpha: number,
) {
  for (const b of bodies) {
    if (b.trailCount < 2) continue;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const steps = Math.min(b.trailCount - 1, 48);
    const stride = Math.max(1, Math.floor((b.trailCount - 1) / steps));
    for (let i = stride; i < b.trailCount; i += stride) {
      const a = trailPoint(b, i - stride);
      const c = trailPoint(b, i);
      if (!a || !c) continue;
      const t = i / b.trailCount;
      const p1 = screenOf(a.x, a.y, cam, w, h);
      const p2 = screenOf(c.x, c.y, cam, w, h);
      ctx.strokeStyle = cssRgb(b.color, t * t * 0.62);
      ctx.lineWidth = Math.max(0.6, (0.4 + t * 1.6) * cam.zoom * (b.radius / 10));
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    const last = trailPoint(b, b.trailCount - 1);
    if (last) {
      const p = screenOf(last.x, last.y, cam, w, h);
      const now = screenOf(
        b.px + (b.x - b.px) * alpha,
        b.py + (b.y - b.py) * alpha,
        cam,
        w,
        h,
      );
      ctx.strokeStyle = cssRgb(b.color, 0.55);
      ctx.lineWidth = Math.max(0.8, 1.4 * cam.zoom * (b.radius / 10));
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(now.x, now.y);
      ctx.stroke();
    }
  }
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  b: Body,
  cam: Camera,
  w: number,
  h: number,
  alpha: number,
) {
  const x = b.px + (b.x - b.px) * alpha;
  const y = b.py + (b.y - b.py) * alpha;
  const p = screenOf(x, y, cam, w, h);
  const r = Math.max(1.4, b.radius * cam.zoom);

  if (b.kind === "star" || b.mass > 3000) {
    const glow = ctx.createRadialGradient(p.x, p.y, r * 0.2, p.x, p.y, r * 4.2);
    glow.addColorStop(0, cssRgb(b.color, 0.38));
    glow.addColorStop(0.35, cssRgb(b.color, 0.1));
    glow.addColorStop(1, cssRgb(b.color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 4.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const hx = p.x - r * 0.28;
  const hy = p.y - r * 0.3;
  const g = ctx.createRadialGradient(hx, hy, r * 0.08, p.x, p.y, r);
  g.addColorStop(0, cssRgb({ r: 255, g: 255, b: 252 }, 0.92));
  g.addColorStop(0.22, cssRgb(b.color, 1));
  g.addColorStop(
    1,
    cssRgb(
      {
        r: b.color.r * 0.38,
        g: b.color.g * 0.4,
        b: b.color.b * 0.45,
      },
      1,
    ),
  );
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = cssRgb({ r: 255, g: 255, b: 255 }, 0.12);
  ctx.lineWidth = Math.max(0.6, r * 0.05);
  ctx.stroke();
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  w: number,
  h: number,
) {
  for (const p of world.particles) {
    const s = screenOf(p.x, p.y, cam, w, h);
    const a = Math.max(0, p.life / p.max);
    ctx.fillStyle = cssRgb(p.color, a * 0.85);
    ctx.beginPath();
    ctx.arc(s.x, s.y, p.size * cam.zoom, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAim(
  ctx: CanvasRenderingContext2D,
  aim: AimState,
  cam: Camera,
  w: number,
  h: number,
) {
  if (!aim.active) return;
  const origin = screenOf(aim.x, aim.y, cam, w, h);
  const tipW = {
    x: aim.x + aim.vx * 0.42,
    y: aim.y + aim.vy * 0.42,
  };
  const tip = screenOf(tipW.x, tipW.y, cam, w, h);

  if (aim.path && aim.path.length >= 4) {
    ctx.beginPath();
    for (let i = 0; i < aim.path.length; i += 2) {
      const p = screenOf(aim.path[i]!, aim.path[i + 1]!, cam, w, h);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = "rgba(197, 205, 216, 0.35)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.strokeStyle = "rgba(236, 236, 232, 0.85)";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  const ang = Math.atan2(tip.y - origin.y, tip.x - origin.x);
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(
    tip.x - Math.cos(ang - 0.4) * 9,
    tip.y - Math.sin(ang - 0.4) * 9,
  );
  ctx.lineTo(
    tip.x - Math.cos(ang + 0.4) * 9,
    tip.y - Math.sin(ang + 0.4) * 9,
  );
  ctx.closePath();
  ctx.fillStyle = "rgba(236, 236, 232, 0.9)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(236, 236, 232, 0.9)";
  ctx.fill();
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const v = ctx.createRadialGradient(
    w * 0.5,
    h * 0.5,
    Math.min(w, h) * 0.35,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.72,
  );
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: World,
  w: number,
  h: number,
  alpha: number,
  aim: AimState,
  trails: boolean,
) {
  const shake = world.trauma * world.trauma;
  const ox = world.reducedMotion
    ? 0
    : (Math.random() * 2 - 1) * shake * 10;
  const oy = world.reducedMotion
    ? 0
    : (Math.random() * 2 - 1) * shake * 10;

  ctx.setTransform(1, 0, 0, 1, ox, oy);
  drawStarfield(ctx, w, h, world.camera);
  if (trails) drawTrails(ctx, world.bodies, world.camera, w, h, alpha);
  drawAim(ctx, aim, world.camera, w, h);
  drawParticles(ctx, world, world.camera, w, h);
  for (const b of world.bodies) {
    drawBody(ctx, b, world.camera, w, h, alpha);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawVignette(ctx, w, h);
}
