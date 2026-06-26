import { ACHIEVEMENTS } from "../content/achievements";
import { GameState } from "../state/types";
import { Decimal, ONE } from "./decimal";

export function isUnlocked(state: GameState, id: string): boolean {
  return state.achievements[id] === true;
}

/** Latch every achievement whose condition now holds. Returns newly-unlocked ids. */
export function checkAchievements(state: GameState): string[] {
  const fresh: string[] = [];
  for (const ach of ACHIEVEMENTS) {
    if (!isUnlocked(state, ach.id) && ach.check(state)) {
      state.achievements[ach.id] = true;
      fresh.push(ach.id);
    }
  }
  return fresh;
}

/** Product of every unlocked achievement's multiplier (folds into computeGlobalMult). */
export function achievementMult(state: GameState): Decimal {
  let mult = ONE;
  for (const ach of ACHIEVEMENTS) {
    if (isUnlocked(state, ach.id)) mult = mult.mul(ach.mult);
  }
  return mult;
}
