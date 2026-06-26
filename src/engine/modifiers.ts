import { GameState } from "../state/types";
import { Decimal, ONE } from "./decimal";
import { sinById } from "../content/sins";

// The single channel through which a Sin Trial's constraints reach the engine.
// combat/hunger/training/greed/appraisal read these — never `if (activeTrial)`.
export interface Modifiers {
  dpsMult: Decimal;
  absorbMult: Decimal;
  hungerRateMult: number;
  greedLocked: boolean;
  trainingLocked: boolean;
  appraisalLocked: boolean;
}

export const NEUTRAL_MODIFIERS: Modifiers = {
  dpsMult: ONE,
  absorbMult: ONE,
  hungerRateMult: 1,
  greedLocked: false,
  trainingLocked: false,
  appraisalLocked: false,
};

export function activeModifiers(state: GameState): Modifiers {
  const id = state.activeTrial;
  if (!id) return NEUTRAL_MODIFIERS;
  const sin = sinById(id);
  if (!sin) return NEUTRAL_MODIFIERS;
  return { ...NEUTRAL_MODIFIERS, ...sin.constraint };
}
