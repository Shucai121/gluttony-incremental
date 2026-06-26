import { TRANSCEND_MORTAL_SINS } from "../content/transcendence";
import { GameState } from "../state/types";
import { Decimal, D, ONE, ZERO } from "./decimal";
import { resetRun } from "./reset";

export function canTranscend(state: GameState): boolean {
  return state.mortalSins.gte(TRANSCEND_MORTAL_SINS);
}

/** SPEC §6: gain = floor(log10(sins + 1)). break_eternity's .log10() returns a Decimal. */
export function divinityGain(state: GameState): Decimal {
  return D(Math.floor(state.sins.max(ZERO).add(1).log10().toNumber()));
}

/**
 * Transcend into God's Domain (Reality analog). Obeys the §4 Transcendence column:
 * wipes every prior layer (1-3) but keeps divinity/transcendences and the permanent
 * meta — perks, achievements, titles, settings. Banks Divinity. Returns the gain.
 */
export function transcend(state: GameState): Decimal {
  if (!canTranscend(state)) return ZERO;

  const gain = divinityGain(state);

  resetRun(state); // souls, stats, frenzyBought, current, totalKills, zone, maxZone, hunger
  // Layer 1 (Digest/Awaken/Greed)
  state.gluttonyLevel = ZERO;
  state.awakenings = ZERO;
  state.greed = { form: 0, bloodCharge: ZERO };
  // Layer 1.5 (Feeding Frenzy) + autobuyers + Phase 6 content
  state.sinEssence = ZERO;
  state.devourerRank = 0;
  state.essenceUpgrades = {};
  state.autobuyers = {};
  state.sinTrials = {};
  state.activeTrial = null;
  state.skills = {};
  state.appraisal = {};
  // Layer 2 (Mortal Sin)
  state.sins = ZERO;
  state.mortalSins = ZERO;
  state.sinTree = {};

  state.divinity = state.divinity.add(gain);
  state.transcendences = state.transcendences.add(ONE);
  return gain;
}
