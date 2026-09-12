import { create } from "zustand";
import type { MassKind, SceneId } from "./types";

interface SimUi {
  started: boolean;
  mass: MassKind;
  timeScale: number;
  paused: boolean;
  trails: boolean;
  follow: boolean;
  scene: SceneId;
  bodyCount: number;
  loadToken: number;
  start: () => void;
  setMass: (mass: MassKind) => void;
  setTimeScale: (timeScale: number) => void;
  togglePaused: () => void;
  setPaused: (paused: boolean) => void;
  toggleTrails: () => void;
  toggleFollow: () => void;
  setScene: (scene: SceneId) => void;
  setBodyCount: (bodyCount: number) => void;
  requestClear: () => void;
  requestLoad: (scene?: SceneId) => void;
}

export const useSimStore = create<SimUi>((set) => ({
  started: false,
  mass: "planet",
  timeScale: 1,
  paused: false,
  trails: true,
  follow: true,
  scene: "system",
  bodyCount: 0,
  loadToken: 0,
  start: () => set({ started: true }),
  setMass: (mass) => set({ mass }),
  setTimeScale: (timeScale) => set({ timeScale }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setPaused: (paused) => set({ paused }),
  toggleTrails: () => set((s) => ({ trails: !s.trails })),
  toggleFollow: () => set((s) => ({ follow: !s.follow })),
  setScene: (scene) => set((s) => ({ scene, loadToken: s.loadToken + 1 })),
  setBodyCount: (bodyCount) => set({ bodyCount }),
  requestClear: () =>
    set((s) => ({ scene: "empty", loadToken: s.loadToken + 1 })),
  requestLoad: (scene) =>
    set((s) => ({
      scene: scene ?? s.scene,
      loadToken: s.loadToken + 1,
    })),
}));
