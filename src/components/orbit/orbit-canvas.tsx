import { useEffect, useRef } from "react";
import { playLaunch, playMerge, unlockAudio } from "@/lib/sim/audio";
import { DT, barycenter } from "@/lib/sim/physics";
import { worldOf } from "@/lib/sim/camera";
import { renderWorld } from "@/lib/sim/render";
import { useSimStore, type Tool } from "@/lib/sim/store";
import { World, type AimState } from "@/lib/sim/world";
import type { MassKind, SceneId } from "@/lib/sim/types";

interface PointerRec {
  id: number;
  x: number;
  y: number;
  button: number;
}

export function OrbitCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return;

    const world = new World();
    world.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ui = {
      started: useSimStore.getState().started,
      mass: useSimStore.getState().mass as MassKind,
      timeScale: useSimStore.getState().timeScale,
      paused: useSimStore.getState().paused,
      trails: useSimStore.getState().trails,
      follow: useSimStore.getState().follow,
      scene: useSimStore.getState().scene as SceneId,
      loadToken: useSimStore.getState().loadToken,
      tool: useSimStore.getState().tool as Tool,
      zoomSeq: useSimStore.getState().zoomSeq,
    };

    const pointers = new Map<number, PointerRec>();
    const aim: AimState = {
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      path: null,
    };
    let aiming = false;
    let panning = false;
    let lastPan: { x: number; y: number } | null = null;
    let pinchDist = 0;
    let acc = 0;
    let last = performance.now();
    let raf = 0;
    let countTick = 0;
    let cssW = 1;
    let cssH = 1;
    let fitted = false;

    const fitNarrowView = () => {
      if (cssW > 0 && cssW < 640) {
        world.camera.zoom *= 1.22;
      }
    };

    useSimStore.getState().setBodyCount(world.bodies.length);

    const unsub = useSimStore.subscribe((s) => {
      if (s.loadToken !== ui.loadToken) {
        ui.scene = s.scene;
        ui.loadToken = s.loadToken;
        if (s.scene === "empty") {
          world.clear();
        } else {
          world.load(s.scene);
        }
        fitNarrowView();
        useSimStore.getState().setBodyCount(world.bodies.length);
      }
      if (s.follow !== ui.follow) {
        const com = barycenter(world.bodies);
        if (s.follow) {
          world.camera.panX = world.camera.x - com.x;
          world.camera.panY = world.camera.y - com.y;
        } else {
          world.camera.panX = world.camera.x;
          world.camera.panY = world.camera.y;
        }
      }
      if (s.zoomSeq !== ui.zoomSeq) {
        ui.zoomSeq = s.zoomSeq;
        world.zoomAt(cssW * 0.5, cssH * 0.5, cssW, cssH, s.zoomFactor);
      }
      if (s.tool !== ui.tool) {
        ui.tool = s.tool;
        aiming = false;
        aim.active = false;
        aim.path = null;
      }
      ui.started = s.started;
      ui.mass = s.mass;
      ui.timeScale = s.timeScale;
      ui.paused = s.paused;
      ui.trails = s.trails;
      ui.follow = s.follow;
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!fitted) {
        fitted = true;
        fitNarrowView();
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const onVp = () => resize();
    window.visualViewport?.addEventListener("resize", onVp);

    const local = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const capture = (e: PointerEvent) => {
      try {
        if (e.pointerId >= 0) canvas.setPointerCapture(e.pointerId);
      } catch {
        /* some input paths reject capture */
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!ui.started) return;
      e.preventDefault();
      unlockAudio();
      capture(e);
      const p = local(e);
      const isPrimary = e.button === 0 || e.pointerType !== "mouse";
      pointers.set(e.pointerId, {
        id: e.pointerId,
        x: p.x,
        y: p.y,
        button: isPrimary ? 0 : e.button,
      });

      if (pointers.size === 2) {
        aiming = false;
        aim.active = false;
        aim.path = null;
        panning = true;
        const [a, b] = [...pointers.values()];
        if (a && b) {
          lastPan = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        }
        return;
      }

      if (e.button === 1 || e.button === 2 || e.altKey || ui.tool === "pan") {
        panning = true;
        lastPan = p;
        return;
      }

      if (isPrimary) {
        const wpt = worldOf(p.x, p.y, world.camera, cssW, cssH);
        aiming = true;
        aim.active = true;
        aim.x = wpt.x;
        aim.y = wpt.y;
        aim.vx = 0;
        aim.vy = 0;
        aim.path = null;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rec = pointers.get(e.pointerId);
      if (!rec) return;
      if (aiming || panning || pointers.size > 0) e.preventDefault();
      const p = local(e);
      rec.x = p.x;
      rec.y = p.y;

      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        if (!a || !b) return;
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastPan) {
          world.addPan(
            -((mid.x - lastPan.x) / world.camera.zoom),
            -((mid.y - lastPan.y) / world.camera.zoom),
          );
        }
        if (pinchDist > 8 && dist > 8) {
          world.zoomAt(mid.x, mid.y, cssW, cssH, dist / pinchDist);
        }
        lastPan = mid;
        pinchDist = dist;
        return;
      }

      if (panning && lastPan) {
        world.addPan(
          -((p.x - lastPan.x) / world.camera.zoom),
          -((p.y - lastPan.y) / world.camera.zoom),
        );
        lastPan = p;
        return;
      }

      if (aiming) {
        const now = worldOf(p.x, p.y, world.camera, cssW, cssH);
        const vel = world.velocityFromDrag(now.x - aim.x, now.y - aim.y);
        aim.vx = vel.vx;
        aim.vy = vel.vy;
      }
    };

    const endPointer = (e: PointerEvent, spawn: boolean) => {
      const rec = pointers.get(e.pointerId);
      pointers.delete(e.pointerId);
      try {
        if (e.pointerId >= 0) canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      if (pointers.size < 2) pinchDist = 0;
      if (pointers.size === 0) {
        panning = false;
        lastPan = null;
      }
      if (!rec) return;
      if (
        spawn &&
        aiming &&
        rec.button === 0 &&
        pointers.size === 0 &&
        ui.tool === "launch"
      ) {
        aiming = false;
        aim.active = false;
        const spawned = world.spawn(ui.mass, aim.x, aim.y, aim.vx, aim.vy);
        if (spawned) {
          playLaunch(Math.hypot(aim.vx, aim.vy));
          useSimStore.getState().setBodyCount(world.bodies.length);
        }
        aim.path = null;
      } else if (aiming && pointers.size === 0) {
        aiming = false;
        aim.active = false;
        aim.path = null;
      }
    };

    const onPointerUp = (e: PointerEvent) => endPointer(e, true);
    const onPointerAbort = (e: PointerEvent) => endPointer(e, false);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!ui.started) return;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const factor = Math.exp(-e.deltaY * 0.0015);
      world.zoomAt(sx, sy, cssW, cssH, factor);
    };

    const onContext = (e: Event) => e.preventDefault();

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        useSimStore.getState().togglePaused();
      }
      if (e.code === "KeyC") useSimStore.getState().requestClear();
      if (e.code === "KeyT") useSimStore.getState().toggleTrails();
      if (e.code === "KeyF") useSimStore.getState().toggleFollow();
      if (e.code === "KeyH") {
        useSimStore.getState().setTool(
          useSimStore.getState().tool === "pan" ? "launch" : "pan",
        );
      }
      if (e.code === "Digit0") world.resetView();
      if (e.code === "Digit1") useSimStore.getState().setMass("dust");
      if (e.code === "Digit2") useSimStore.getState().setMass("moon");
      if (e.code === "Digit3") useSimStore.getState().setMass("planet");
      if (e.code === "Digit4") useSimStore.getState().setMass("giant");
      if (e.code === "Digit5") useSimStore.getState().setMass("star");
      if (e.code === "BracketLeft") {
        useSimStore.getState().setTimeScale(Math.max(0.25, ui.timeScale / 2));
      }
      if (e.code === "BracketRight") {
        useSimStore.getState().setTimeScale(Math.min(8, ui.timeScale * 2));
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
    canvas.addEventListener("pointermove", onPointerMove, { passive: false });
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerAbort);
    canvas.addEventListener("lostpointercapture", onPointerAbort);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onContext);
    window.addEventListener("gesturestart", onContext, { passive: false });
    window.addEventListener("keydown", onKey);

    const loop = (now: number) => {
      const raw = Math.min(0.05, (now - last) / 1000);
      last = now;
      const playing = !ui.paused;
      acc += raw * (playing ? ui.timeScale : 0);
      let steps = 0;
      const merges: { mass: number }[] = [];
      while (acc >= DT && steps < 24) {
        const ev = world.step(DT, ui.trails);
        for (const event of ev) merges.push(event);
        acc -= DT;
        steps++;
      }
      if (merges.length) {
        playMerge(merges[merges.length - 1]!.mass);
        useSimStore.getState().setBodyCount(world.bodies.length);
      }
      world.followCamera(raw, ui.follow);
      world.decayTrauma(raw);

      if (aiming) {
        aim.path = world.predict(ui.mass, aim.x, aim.y, aim.vx, aim.vy);
      }

      countTick += raw;
      if (countTick > 0.4) {
        countTick = 0;
        const n = world.bodies.length;
        if (n !== useSimStore.getState().bodyCount) {
          useSimStore.getState().setBodyCount(n);
        }
      }

      const alpha = acc / DT;
      renderWorld(ctx, world, cssW, cssH, playing ? alpha : 1, aim, ui.trails);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      unsub();
      ro.disconnect();
      window.visualViewport?.removeEventListener("resize", onVp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerAbort);
      canvas.removeEventListener("lostpointercapture", onPointerAbort);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContext);
      window.removeEventListener("gesturestart", onContext);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 size-full touch-none select-none"
      aria-label="Ciel orbital — glissez pour lancer un corps"
    />
  );
}
