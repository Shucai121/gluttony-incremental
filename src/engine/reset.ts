import { AWAKEN_DIGEST_REQUIREMENT, DIGEST_GLOBAL_MULT, DIGEST_KILL_REQUIREMENT, DIGEST_STAT_REQUIREMENT } from "../content/resets";
import { spawnEnemy } from "../content/enemies";
import { GameState, STAT_ORDER } from "../state/types";
import { defaultState } from "../state/store";
import { Decimal, D, ONE, ZERO } from "./decimal";

function bestStatValue(state: GameState): Decimal {
  let best = ZERO;
  for (const stat of STAT_ORDER) {
    if (state.stats[stat].value.gt(best)) best = state.stats[stat].value;
  }
  return best;
}

function resetRun(state: GameState): void {
  const fresh = defaultState();
  state.souls = fresh.souls;
  state.stats = fresh.stats;
  state.frenzyBought = fresh.frenzyBought;
  state.current = spawnEnemy(0, ZERO);
  state.totalKills = ZERO;
  state.hunger = 0;
  state.zone = 0;
  state.maxZone = 0;
}

export function canDigest(state: GameState): boolean {
  return state.totalKills.gte(DIGEST_KILL_REQUIREMENT) || bestStatValue(state).gte(DIGEST_STAT_REQUIREMENT);
}

export function digest(state: GameState): boolean {
  if (!canDigest(state)) return false;

  const nextLevel = state.gluttonyLevel.add(ONE);
  resetRun(state);
  state.gluttonyLevel = nextLevel;
  return true;
}

export function canAwaken(state: GameState): boolean {
  return state.gluttonyLevel.gte(AWAKEN_DIGEST_REQUIREMENT);
}

export function awaken(state: GameState): boolean {
  if (!canAwaken(state)) return false;

  const nextAwakenings = state.awakenings.add(ONE);
  resetRun(state);
  state.gluttonyLevel = ZERO;
  state.awakenings = nextAwakenings;
  return true;
}

export function digestMult(gluttonyLevel: Decimal): Decimal {
  return D(DIGEST_GLOBAL_MULT).pow(gluttonyLevel);
}
