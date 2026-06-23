import { RANK_MULT_BASE, RANK_THRESHOLDS, RANKS } from "../content/ranks";
import { GameState } from "../state/types";
import { Decimal, D } from "./decimal";

export function rankName(state: GameState): string {
  return RANKS[state.devourerRank] ?? RANKS[RANKS.length - 1];
}

export function rankMult(state: GameState): Decimal {
  return D(RANK_MULT_BASE).pow(state.devourerRank);
}

/** Raise devourerRank to match cumulative sinEssence. Ratchet: never lowers. */
export function updateDevourerRank(state: GameState): void {
  let earned = 0;
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
    if (state.sinEssence.gte(RANK_THRESHOLDS[i])) earned = i;
  }
  state.devourerRank = Math.max(state.devourerRank, earned);
}
