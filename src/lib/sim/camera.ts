import type { Camera } from "./types";

export function screenOf(x: number, y: number, cam: Camera, w: number, h: number) {
  return {
    x: (x - cam.x) * cam.zoom + w * 0.5,
    y: (y - cam.y) * cam.zoom + h * 0.5,
  };
}

export function worldOf(sx: number, sy: number, cam: Camera, w: number, h: number) {
  return {
    x: (sx - w * 0.5) / cam.zoom + cam.x,
    y: (sy - h * 0.5) / cam.zoom + cam.y,
  };
}
