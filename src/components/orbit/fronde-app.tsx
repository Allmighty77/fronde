import { Hud } from "./hud";
import { OrbitCanvas } from "./orbit-canvas";
import { StartOverlay } from "./start-overlay";

export function FrondeApp() {
  return (
    <main className="fixed inset-0 h-[100dvh] w-full overflow-hidden overscroll-none bg-bg text-fg select-none">
      <OrbitCanvas />
      <Hud />
      <StartOverlay />
    </main>
  );
}
