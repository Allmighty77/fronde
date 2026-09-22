import { useState } from "react";
import {
  ChevronUp,
  Crosshair,
  Eraser,
  Minus,
  Pause,
  Play,
  Plus,
  Spline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MASS_PRESETS, SCENES, cssRgb, radiusFromMass } from "@/lib/sim/constants";
import { useSimStore } from "@/lib/sim/store";
import { cn } from "@/lib/utils";

export function Hud() {
  const started = useSimStore((s) => s.started);
  const mass = useSimStore((s) => s.mass);
  const timeScale = useSimStore((s) => s.timeScale);
  const paused = useSimStore((s) => s.paused);
  const trails = useSimStore((s) => s.trails);
  const follow = useSimStore((s) => s.follow);
  const scene = useSimStore((s) => s.scene);
  const bodyCount = useSimStore((s) => s.bodyCount);
  const tool = useSimStore((s) => s.tool);
  const [more, setMore] = useState(false);

  if (!started) return null;

  const massLabel = MASS_PRESETS.find((p) => p.id === mass)?.label ?? "Planète";

  return (
    <div className="hud-shell pointer-events-none absolute inset-0 z-10 flex flex-col justify-between">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-xl leading-tight tracking-tight text-fg italic sm:text-3xl">
            Fronde
          </p>
          <p className="mt-0.5 text-xs text-muted tabular-nums">
            {bodyCount} corps
            <span className="sm:hidden">
              {" · "}
              {tool === "pan" ? "déplacer" : "lancer"}
              {" · "}
              {massLabel}
            </span>
          </p>
        </div>
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg bg-surface/90 p-0.5">
          <Button
            variant="quiet"
            size="icon"
            aria-label={paused ? "Lecture" : "Pause"}
            onClick={() => useSimStore.getState().togglePaused()}
          >
            {paused ? (
              <Play className="size-4 ml-px" />
            ) : (
              <Pause className="size-4" />
            )}
          </Button>
          <Button
            variant={trails ? "quiet" : "ghost"}
            size="icon"
            className="hidden sm:inline-flex"
            aria-label="Traînées"
            aria-pressed={trails}
            onClick={() => useSimStore.getState().toggleTrails()}
          >
            <Spline className="size-4" />
          </Button>
          <Button
            variant={follow ? "quiet" : "ghost"}
            size="icon"
            className="hidden sm:inline-flex"
            aria-label="Suivre le barycentre"
            aria-pressed={follow}
            onClick={() => useSimStore.getState().toggleFollow()}
          >
            <Crosshair className="size-4" />
          </Button>
          <Button
            variant="quiet"
            size="icon"
            className="sm:hidden"
            aria-label="Zoomer moins"
            onClick={() => useSimStore.getState().nudgeZoom(1 / 1.28)}
          >
            <Minus className="size-4" />
          </Button>
          <Button
            variant="quiet"
            size="icon"
            className="sm:hidden"
            aria-label="Zoomer plus"
            onClick={() => useSimStore.getState().nudgeZoom(1.28)}
          >
            <Plus className="size-4" />
          </Button>
          <Button
            variant="quiet"
            size="icon"
            aria-label="Effacer"
            onClick={() => useSimStore.getState().requestClear()}
          >
            <Eraser className="size-4" />
          </Button>
        </div>
      </header>

      <footer className="pointer-events-auto w-full rounded-xl border border-border bg-surface/90 p-1.5 sm:rounded-2xl sm:p-3">
        {more ? (
          <div className="mb-1.5 space-y-1.5 sm:hidden">
            <div className="scroll-strip flex gap-1">
              {SCENES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => useSimStore.getState().setScene(item.id)}
                  className={cn(
                    "h-11 shrink-0 rounded-md px-3 text-sm transition-colors duration-150",
                    scene === item.id
                      ? "bg-accent text-accent-fg"
                      : "bg-surface-2 text-muted",
                  )}
                  aria-pressed={scene === item.id}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                className={cn(
                  "h-11 min-w-0 flex-1 rounded-md text-sm transition-colors duration-150",
                  trails ? "bg-surface-2 text-fg" : "text-muted",
                )}
                aria-pressed={trails}
                onClick={() => useSimStore.getState().toggleTrails()}
              >
                Traînées
              </button>
              <button
                type="button"
                className={cn(
                  "h-11 min-w-0 flex-1 rounded-md text-sm transition-colors duration-150",
                  follow ? "bg-surface-2 text-fg" : "text-muted",
                )}
                aria-pressed={follow}
                onClick={() => useSimStore.getState().toggleFollow()}
              >
                Suivre
              </button>
            </div>
          </div>
        ) : null}

        <div className="mb-1.5 flex h-11 gap-1.5 sm:hidden">
          <div className="flex min-w-0 flex-1 rounded-lg bg-surface-2 p-0.5">
            <button
              type="button"
              className={cn(
                "h-10 min-w-0 flex-1 rounded-md text-sm font-medium transition-colors duration-150",
                tool === "launch" ? "bg-accent text-accent-fg" : "text-muted",
              )}
              aria-pressed={tool === "launch"}
              onClick={() => useSimStore.getState().setTool("launch")}
            >
              Lancer
            </button>
            <button
              type="button"
              className={cn(
                "h-10 min-w-0 flex-1 rounded-md text-sm font-medium transition-colors duration-150",
                tool === "pan" ? "bg-accent text-accent-fg" : "text-muted",
              )}
              aria-pressed={tool === "pan"}
              onClick={() => useSimStore.getState().setTool("pan")}
            >
              Déplacer
            </button>
          </div>
          <button
            type="button"
            className="h-11 w-14 shrink-0 rounded-lg bg-surface-2 text-sm tabular-nums text-fg"
            aria-label="Échelle temporelle"
            onClick={cycleTime}
          >
            {formatScale(timeScale)}
          </button>
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted"
            aria-label="Plus d’options"
            aria-expanded={more}
            onClick={() => setMore((v) => !v)}
          >
            <ChevronUp
              className={cn(
                "size-4 transition-transform duration-150",
                more ? "rotate-0" : "rotate-180",
              )}
            />
          </button>
        </div>

        <div className="flex h-11 sm:hidden">
          {MASS_PRESETS.map((preset) => {
            const active = mass === preset.id;
            const r = Math.min(13, radiusFromMass(preset.mass) * 0.72);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => useSimStore.getState().setMass(preset.id)}
                className={cn(
                  "flex h-11 min-w-0 flex-1 items-center justify-center rounded-md transition-colors duration-150",
                  active ? "bg-surface-2" : "bg-transparent",
                )}
                aria-pressed={active}
                aria-label={preset.label}
              >
                <span
                  className="block rounded-full"
                  style={{
                    width: r * 2,
                    height: r * 2,
                    background: cssRgb(preset.color),
                    boxShadow: active
                      ? `0 0 0 2px var(--color-accent)`
                      : "none",
                  }}
                />
              </button>
            );
          })}
        </div>

        <div className="hidden flex-col gap-2 sm:flex sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-subtle">
              Masse
            </p>
            <div className="flex items-end gap-1.5">
              {MASS_PRESETS.map((preset) => {
                const active = mass === preset.id;
                const r = Math.min(14, radiusFromMass(preset.mass) * 0.78);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => useSimStore.getState().setMass(preset.id)}
                    className={cn(
                      "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-sm px-0.5 py-1 transition-colors duration-150",
                      active ? "bg-surface-2 text-fg" : "text-muted",
                    )}
                    aria-pressed={active}
                    aria-label={preset.label}
                  >
                    <span
                      className="block rounded-full"
                      style={{
                        width: r * 2,
                        height: r * 2,
                        background: cssRgb(preset.color),
                      }}
                    />
                    <span className="max-w-full truncate text-xs leading-none">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 flex-col gap-2 sm:flex sm:w-72">
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-subtle">
                Temps
              </p>
              <input
                type="range"
                min={0}
                max={6}
                step={1}
                value={scaleIndex(timeScale)}
                onChange={(e) =>
                  useSimStore
                    .getState()
                    .setTimeScale(SCALES[Number(e.target.value)] ?? 1)
                }
                className="h-11 min-w-0 flex-1 accent-accent"
                aria-label="Échelle temporelle"
              />
              <p className="w-8 shrink-0 text-right text-xs tabular-nums text-fg">
                {formatScale(timeScale)}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {SCENES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => useSimStore.getState().setScene(item.id)}
                  className={cn(
                    "h-8 rounded-sm px-2 text-xs transition-colors duration-150",
                    scene === item.id
                      ? "bg-accent text-accent-fg"
                      : "bg-surface-2 text-muted hover:text-fg",
                  )}
                  aria-pressed={scene === item.id}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const SCALES = [0.25, 0.5, 1, 2, 4, 6, 8];

function scaleIndex(value: number) {
  let best = 2;
  let dist = Infinity;
  SCALES.forEach((s, i) => {
    const d = Math.abs(s - value);
    if (d < dist) {
      dist = d;
      best = i;
    }
  });
  return best;
}

function formatScale(value: number) {
  if (value < 1) return `×${value}`;
  return `×${value % 1 === 0 ? value.toFixed(0) : value}`;
}

function cycleTime() {
  const current = useSimStore.getState().timeScale;
  const i = scaleIndex(current);
  const next = SCALES[(i + 1) % SCALES.length] ?? 1;
  useSimStore.getState().setTimeScale(next);
}
