let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

export function unlockAudio() {
  const a = audio();
  if (a && a.state === "suspended") void a.resume();
}

function envGain(a: AudioContext, t: number, peak: number, dur: number) {
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  return g;
}

export function playLaunch(speed: number) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  o.type = "triangle";
  const f = 180 + Math.min(speed, 400) * 0.7;
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(f * 0.45, t + 0.14);
  const g = envGain(a, t, 0.045, 0.16);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + 0.18);
}

export function playMerge(mass: number) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  o.type = "sine";
  const f = 90 + 520 / Math.sqrt(Math.max(mass, 8));
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(36, t + 0.22);
  const g = envGain(a, t, 0.07, 0.28);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + 0.3);
}
