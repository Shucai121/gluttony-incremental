import { GREED_BURST, GREED_FORMS, GreedForm } from "../content/greed";
import { GameState, STAT_ORDER } from "../state/types";
import { Decimal, ZERO } from "./decimal";
import { activeModifiers } from "./modifiers";

export function currentGreedForm(state: GameState): GreedForm {
  return GREED_FORMS[state.greed.form] ?? GREED_FORMS[0];
}

export function nextGreedForm(state: GameState): GreedForm | null {
  return GREED_FORMS[state.greed.form + 1] ?? null;
}

export function greedMult(state: GameState): Decimal {
  const formMult = currentGreedForm(state).damageMult;
  return state.greed.bloodCharge.gt(ZERO) ? formMult.mul(GREED_BURST.damageMult) : formMult;
}

export function canAdvanceForm(state: GameState): boolean {
  if (activeModifiers(state).greedLocked) return false;
  const next = nextGreedForm(state);
  if (!next) return false;
  if (state.souls.lt(next.unlockCost.souls)) return false;

  return STAT_ORDER.every((stat) => state.stats[stat].value.gte(next.unlockCost.stats[stat]));
}

export function advanceForm(state: GameState): boolean {
  const next = nextGreedForm(state);
  if (!next || !canAdvanceForm(state)) return false;

  state.souls = state.souls.sub(next.unlockCost.souls);
  for (const stat of STAT_ORDER) {
    state.stats[stat].value = state.stats[stat].value.sub(next.unlockCost.stats[stat]);
  }
  state.greed.form += 1;
  return true;
}

export function canTriggerBloodBurst(state: GameState): boolean {
  return state.greed.bloodCharge.lte(ZERO) && state.stats.VIT.value.gte(GREED_BURST.vitCost);
}

export function triggerBloodBurst(state: GameState): boolean {
  if (!canTriggerBloodBurst(state)) return false;

  state.stats.VIT.value = state.stats.VIT.value.sub(GREED_BURST.vitCost);
  state.greed.bloodCharge = GREED_BURST.durationSec;
  return true;
}

export function tickGreed(state: GameState, deltaSec: number): void {
  if (state.greed.bloodCharge.lte(ZERO)) return;

  const remaining = state.greed.bloodCharge.sub(deltaSec);
  state.greed.bloodCharge = remaining.gt(ZERO) ? remaining : ZERO;
}
