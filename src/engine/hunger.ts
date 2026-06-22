import { HUNGER_RATE } from "../content/hunger";
import { MND_SCALE } from "../content/combat";
import { GameState } from "../state/types";

export function hungerRatio(state: GameState): number {
  if (state.hungerMax <= 0) return 0;
  return Math.min(1, Math.max(0, state.hunger / state.hungerMax));
}

export function tickHunger(state: GameState, deltaSec: number): void {
  const mndReduction = 1 + state.stats.MND.value.div(MND_SCALE).toNumber();
  const next = state.hunger + (HUNGER_RATE * deltaSec) / mndReduction;
  state.hunger = Math.min(state.hungerMax, Math.max(0, next));
}
