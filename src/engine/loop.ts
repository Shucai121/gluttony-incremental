export type TickFn = (deltaSec: number) => void;

const TICK_MS = 50; // 20 logical updates/sec
const MAX_CATCHUP = 2000; // cap ticks processed in one animation frame

/** Fixed-timestep accumulator loop driven by requestAnimationFrame. Returns stop(). */
export function startLoop(tick: TickFn): () => void {
  let last = performance.now();
  let acc = 0;
  let raf = 0;

  const frame = (now: number) => {
    acc += now - last;
    last = now;
    let steps = 0;
    while (acc >= TICK_MS && steps < MAX_CATCHUP) {
      tick(TICK_MS / 1000);
      acc -= TICK_MS;
      steps++;
    }
    if (steps >= MAX_CATCHUP) acc = 0; // drop backlog instead of freezing
    raf = requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
