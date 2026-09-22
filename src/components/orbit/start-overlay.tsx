import { Button } from "@/components/ui/button";
import { useSimStore } from "@/lib/sim/store";

export function StartOverlay() {
  const started = useSimStore((s) => s.started);
  if (started) return null;

  return (
    <div className="hud-shell absolute inset-0 z-20 flex items-center justify-center bg-bg/50">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-widest text-subtle">
          Gravité n-corps
        </p>
        <h1 className="font-display mt-3 text-5xl leading-none tracking-tight text-fg italic sm:text-6xl">
          Fronde
        </h1>
        <p className="mt-4 max-w-sm text-pretty text-sm leading-relaxed text-muted">
          Glissez pour lancer un corps. La longueur du geste donne la vitesse.
          Les collisions fusionnent masse et quantité de mouvement.
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-muted sm:hidden">
          <li>Lancer — un doigt</li>
          <li>Déplacer — bouton, ou deux doigts</li>
          <li>Zoom — +/− ou pincement</li>
        </ul>
        <ul className="mt-5 hidden space-y-1.5 text-sm text-muted sm:block">
          <li>Clic-glisser pour lancer</li>
          <li>Clic droit ou deux doigts pour déplacer</li>
          <li>Molette ou pincement pour zoomer</li>
        </ul>
        <Button
          variant="primary"
          className="mt-6 h-12 w-full rounded-lg text-base"
          onClick={() => useSimStore.getState().start()}
        >
          Entrer
        </Button>
      </div>
    </div>
  );
}
