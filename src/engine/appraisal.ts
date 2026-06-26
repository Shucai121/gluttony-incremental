import {
  APPRAISAL,
  APPRAISAL_FREE_ZONES,
  APPRAISAL_ZONES_PER_LEVEL,
  appraisalNodeById,
} from "../content/appraisal";
import { GameState } from "../state/types";
import { Decimal, ZERO, geometricCost } from "./decimal";

export function appraisalLevel(state: GameState, id: string): number {
  return state.appraisal[id] ?? 0;
}

export function appraisalCost(state: GameState, id: string): Decimal {
  const node = appraisalNodeById(id);
  if (!node) return ZERO;
  return geometricCost(node.baseCost, node.costMult, appraisalLevel(state, id));
}

export function canBuyAppraisal(state: GameState, id: string): boolean {
  const node = appraisalNodeById(id);
  if (!node) return false;
  if (node.maxLevel !== null && appraisalLevel(state, id) >= node.maxLevel) return false;
  return state.sinEssence.gte(appraisalCost(state, id));
}

export function buyAppraisal(state: GameState, id: string): boolean {
  if (!canBuyAppraisal(state, id)) return false;
  state.sinEssence = state.sinEssence.sub(appraisalCost(state, id));
  state.appraisal[id] = appraisalLevel(state, id) + 1;
  return true;
}

/** Deepest zone the player may descend to, gated by Deep Sight. */
export function appraisalZoneCap(state: GameState): number {
  return APPRAISAL_FREE_ZONES + APPRAISAL_ZONES_PER_LEVEL * appraisalLevel(state, "deep-sight");
}

export function isAppraised(state: GameState): boolean {
  return appraisalLevel(state, "predator-eye") > 0;
}

export function hasAppraisal(state: GameState): boolean {
  return APPRAISAL.some((n) => appraisalLevel(state, n.id) > 0);
}
