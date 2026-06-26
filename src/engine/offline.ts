import { GameState } from "../state/types";
import { stepEngine } from "./step";

// Cap offline catch-up at 8 hours. We simulate the elapsed time in a bounded number of
// coarse steps (never more than MAX_STEPS), so a long absence catches up without freezing
// the boot — the per-step dt simply grows for longer absences.
export const OFFLINE_CAP_SEC = 8 * 60 * 60;
const MAX_STEPS = 200;

/**
 * Fast-forward the world by the time the tab was closed. Pure and deterministic. Returns
 * the seconds actually applied (0 when disabled, non-positive, or nothing to do).
 */
export function applyOfflineProgress(state: GameState, elapsedSec: number): number {
  if (!state.settings.offlineProgress) return 0;
  if (!Number.isFinite(elapsedSec) || elapsedSec <= 0) return 0;

  const capped = Math.min(elapsedSec, OFFLINE_CAP_SEC);
  const steps = Math.min(MAX_STEPS, Math.max(1, Math.ceil(capped)));
  const dt = capped / steps;
  for (let i = 0; i < steps; i++) stepEngine(state, dt);
  return capped;
}
