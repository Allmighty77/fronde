import {
  Crosshair,
  Eraser,
  Pause,
  Play,
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

  if (!started) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl leading-tight tracking-tight text-fg italic sm:text-3xl">
            Fronde
          </p>
          <p className="mt-0.5 text-xs text-muted tabular-nums">{bodyCount} corps</p>
        </div>
        <div className="pointer-events-auto flex items-center gap-1">
          <Button
            variant="quiet"
            size="icon"
            className="size-11 sm:size-11"
            aria-label={paused ? "Lecture" : "Pause"}
            onClick={() => useSimStore.getState().togglePaused()}
          >
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </Button>
          <Button
            variant={trails ? "quiet" : "ghost"}
            size="icon"
            aria-label="Traînées"
            aria-pressed={trails}
            onClick={() => useSimStore.getState().toggleTrails()}
          >
            <Spline className="size-4" />
          </Button>
          <Button
            variant={follow ? "quiet" : "ghost"}
            size="icon"
            aria-label="Suivre le barycentre"
            aria-pressed={follow}
            onClick={() => useSimStore.getState().toggleFollow()}
          >
            <Crosshair className="size-4" />
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

      <footer className="pointer-events-auto mb-10 w-full rounded-xl border border-border bg-surface/90 p-2 sm:mb-0 sm:p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className="mb-1 hidden text-xs font-medium uppercase tracking-wide text-subtle sm:block">
              Masse
            </p>
            <div className="flex items-end gap-0.5 sm:gap-1.5">
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
                      active ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
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

          <div className="flex min-w-0 flex-col gap-2 sm:w-72">
            <div className="flex items-center gap-3">
              <p className="hidden text-xs font-medium uppercase tracking-wide text-subtle sm:block">
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
                className="h-8 min-w-0 flex-1 accent-accent sm:h-11"
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
