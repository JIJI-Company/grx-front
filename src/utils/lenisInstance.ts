import type Lenis from 'lenis';

// Shared handle to the single Lenis instance created in Layout, so overlays
// (e.g. IntroGate) can pause/resume smooth scroll. React runs child effects
// before parent effects, so an overlay may call stopLenis() before Layout has
// registered the instance — we keep the desired state and apply it on register.
let instance: Lenis | null = null;
let stopped = false;

export function setLenis(l: Lenis | null): void {
  instance = l;
  if (l) (stopped ? l.stop() : l.start());
}

export function stopLenis(): void {
  stopped = true;
  instance?.stop();
}

export function startLenis(): void {
  stopped = false;
  instance?.start();
}

export function scrollLenisTop(): void {
  instance?.scrollTo(0, { immediate: true });
}
