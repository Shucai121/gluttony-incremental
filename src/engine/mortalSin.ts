import { MORTAL_SIN_RANK } from "../content/mortalSin";
import { GameState } from "../state/types";
import { Decimal, ONE, ZERO } from "./decimal";
import { resetRun } from "./reset";
import { emit } from "./events";
import { format } from "./format";

export function canMortalSin(state: GameState): boolean {
  return state.devourerRank >= MORTAL_SIN_RANK;
}

/** SPEC §6: sinsGain = floor(sinEssence ^ 0.5). */
export function mortalSinGain(state: GameState): Decimal {
  return state.sinEssence.max(ZERO).sqrt().floor();
}

/**
 * Become a Mortal Sin holder (Eternity analog). Clears Phases 2–5 per the §4
 * Mortal Sin column; banks Sins; keeps autobuyers, skills, appraisal, sin trials,
 * and the sin tree. Returns the Sins gained.
 */
export function mortalSinAwaken(state: GameState): Decimal {
  if (!canMortalSin(state)) return ZERO;

  const gain = mortalSinGain(state);

  resetRun(state); // souls, stats, frenzyBought, current, totalKills, zone, maxZone, hunger
  state.gluttonyLevel = ZERO;
  state.awakenings = ZERO;
  state.greed = { form: 0, bloodCharge: ZERO };
  state.sinEssence = ZERO;
  state.devourerRank = 0;
  state.essenceUpgrades = {};

  state.sins = state.sins.add(gain);
  state.mortalSins = state.mortalSins.add(ONE);
  emit({ type: "prestige", layer: "mortal-sin", gain: format(gain) });
  return gain;
}
