import { FRENZY_BASE_COST, FRENZY_COST_MULT } from "../content/combat";
import { TRAINING, TRAINING_GAIN } from "../content/stats";
import { GameState, StatId } from "../state/types";
import { Decimal, DecimalSource, D, ONE, ZERO, geometricCost } from "./decimal";
import { activeModifiers } from "./modifiers";

function geometricBatchCost(currentCost: Decimal, mult: Decimal, quantity: Decimal): Decimal {
  if (quantity.lte(ZERO)) return ZERO;
  return currentCost.mul(mult.pow(quantity).sub(ONE)).div(mult.sub(ONE));
}

function maxAffordable(currentCost: Decimal, mult: Decimal, available: Decimal): Decimal {
  if (available.lt(currentCost)) return ZERO;

  const estimateSource = available.mul(mult.sub(ONE)).div(currentCost).add(ONE);
  const rawEstimate = estimateSource.log10() / mult.log10();
  let quantity = D(Math.floor(Math.max(0, rawEstimate)));

  while (quantity.gt(ZERO) && geometricBatchCost(currentCost, mult, quantity).gt(available)) {
    quantity = quantity.sub(ONE);
  }

  while (geometricBatchCost(currentCost, mult, quantity.add(ONE)).lte(available)) {
    quantity = quantity.add(ONE);
  }

  return quantity;
}

export function trainingCost(state: GameState, stat: StatId): Decimal {
  const config = TRAINING[stat];
  return geometricCost(config.trainBaseCost, config.trainCostMult, state.stats[stat].trained);
}

export function trainingBatchCost(state: GameState, stat: StatId, quantity: DecimalSource): Decimal {
  const config = TRAINING[stat];
  return geometricBatchCost(trainingCost(state, stat), D(config.trainCostMult), D(quantity));
}

export function buyTraining(state: GameState, stat: StatId): boolean {
  if (activeModifiers(state).trainingLocked) return false;
  const cost = trainingCost(state, stat);
  if (state.souls.lt(cost)) return false;

  state.souls = state.souls.sub(cost);
  state.stats[stat].trained = state.stats[stat].trained.add(ONE);
  state.stats[stat].value = state.stats[stat].value.add(TRAINING_GAIN);
  return true;
}

export function buyMaxTraining(state: GameState, stat: StatId): Decimal {
  if (activeModifiers(state).trainingLocked) return ZERO;
  const quantity = maxAffordable(trainingCost(state, stat), D(TRAINING[stat].trainCostMult), state.souls);
  if (quantity.lte(ZERO)) return ZERO;

  state.souls = state.souls.sub(trainingBatchCost(state, stat, quantity));
  state.stats[stat].trained = state.stats[stat].trained.add(quantity);
  state.stats[stat].value = state.stats[stat].value.add(D(TRAINING_GAIN).mul(quantity));
  return quantity;
}

export function frenzyCost(state: GameState): Decimal {
  return geometricCost(FRENZY_BASE_COST, FRENZY_COST_MULT, state.frenzyBought);
}

export function frenzyBatchCost(state: GameState, quantity: DecimalSource): Decimal {
  return geometricBatchCost(frenzyCost(state), D(FRENZY_COST_MULT), D(quantity));
}

export function buyFrenzy(state: GameState): boolean {
  const cost = frenzyCost(state);
  if (state.souls.lt(cost)) return false;

  state.souls = state.souls.sub(cost);
  state.frenzyBought = state.frenzyBought.add(ONE);
  return true;
}

export function buyMaxFrenzy(state: GameState): Decimal {
  const quantity = maxAffordable(frenzyCost(state), D(FRENZY_COST_MULT), state.souls);
  if (quantity.lte(ZERO)) return ZERO;

  state.souls = state.souls.sub(frenzyBatchCost(state, quantity));
  state.frenzyBought = state.frenzyBought.add(quantity);
  return quantity;
}
