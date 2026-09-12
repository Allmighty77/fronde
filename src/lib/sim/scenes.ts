import {
  circularSpeed,
  G,
  PLANET_COLORS,
  presetById,
} from "./constants";
import { createBody, resetIds } from "./physics";
import type { Body, SceneId } from "./types";

function colorAt(i: number) {
  return PLANET_COLORS[i % PLANET_COLORS.length]!;
}

export function buildScene(id: SceneId): Body[] {
  resetIds();
  switch (id) {
    case "empty":
      return [];
    case "star":
      return [
        createBody({
          x: 0,
          y: 0,
          mass: presetById("star").mass,
          color: presetById("star").color,
          kind: "star",
        }),
      ];
    case "binary": {
      const m = 5200;
      const sep = 150;
      const v = 0.5 * Math.sqrt((G * m) / sep);
      return [
        createBody({
          x: -sep,
          y: 0,
          vy: v,
          mass: m,
          color: { r: 236, g: 230, b: 214 },
          kind: "star",
        }),
        createBody({
          x: sep,
          y: 0,
          vy: -v,
          mass: m,
          color: { r: 214, g: 222, b: 232 },
          kind: "star",
        }),
        createBody({
          x: 0,
          y: 420,
          vx: circularSpeed(m * 2, 420) * 0.72,
          mass: 160,
          color: colorAt(0),
          kind: "planet",
        }),
      ];
    }
    case "eight": {
      const SCALE = 210;
      const MASS = 160;
      const vScale = Math.sqrt((G * MASS) / SCALE);
      const p1 = { x: 0.97000436, y: -0.24308753, vx: 0.466203685, vy: 0.43236573 };
      const p2 = { x: -0.97000436, y: 0.24308753, vx: 0.466203685, vy: 0.43236573 };
      const p3 = { x: 0, y: 0, vx: -0.93240737, vy: -0.86473146 };
      const pal = [colorAt(0), colorAt(2), colorAt(1)];
      return [p1, p2, p3].map((p, i) =>
        createBody({
          x: p.x * SCALE,
          y: p.y * SCALE,
          vx: p.vx * vScale,
          vy: p.vy * vScale,
          mass: MASS,
          color: pal[i]!,
          kind: "planet",
        }),
      );
    }
    case "system": {
      const star = createBody({
        x: 0,
        y: 0,
        mass: 11000,
        color: presetById("star").color,
        kind: "star",
      });
      const orbits = [
        { r: 168, mass: 28, kind: "moon" as const, phase: 0.2 },
        { r: 268, mass: 150, kind: "planet" as const, phase: 1.4 },
        { r: 392, mass: 210, kind: "planet" as const, phase: 3.1 },
        { r: 540, mass: 640, kind: "giant" as const, phase: 5.0 },
      ];
      const planets = orbits.map((o, i) => {
        const x = Math.cos(o.phase) * o.r;
        const y = Math.sin(o.phase) * o.r;
        const v = circularSpeed(star.mass, o.r);
        return createBody({
          x,
          y,
          vx: -Math.sin(o.phase) * v,
          vy: Math.cos(o.phase) * v,
          mass: o.mass,
          color: colorAt(i),
          kind: o.kind,
        });
      });
      return [star, ...planets];
    }
    default:
      return [];
  }
}
