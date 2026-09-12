import { Hud } from "./hud";
import { OrbitCanvas } from "./orbit-canvas";
import { StartOverlay } from "./start-overlay";

export function FrondeApp() {
  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-bg text-fg">
      <OrbitCanvas />
      <Hud />
      <StartOverlay />
    </main>
  );
}
