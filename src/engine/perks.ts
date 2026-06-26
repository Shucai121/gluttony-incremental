import { PERKS, perkById } from "../content/perks";
import { GameState } from "../state/types";
import { Decimal, ONE } from "./decimal";

export function ownsPerk(state: GameState, id: string): boolean {
  return state.perks[id] === true;
}

export function canBuyPerk(state: GameState, id: string): boolean {
  const perk = perkById(id);
  if (!perk) return false;
  if (ownsPerk(state, id)) return false;
  return state.divinity.gte(perk.cost);
}

export function buyPerk(state: GameState, id: string): boolean {
  if (!canBuyPerk(state, id)) return false;
  const perk = perkById(id)!;
  state.divinity = state.divinity.sub(perk.cost);
  state.perks[id] = true;
  return true;
}

/** Product of every owned perk's multiplier (folds into computeGlobalMult). */
export function perkMult(state: GameState): Decimal {
  let mult = ONE;
  for (const perk of PERKS) {
    if (ownsPerk(state, perk.id)) mult = mult.mul(perk.mult);
  }
  return mult;
}
