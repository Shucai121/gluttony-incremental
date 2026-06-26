import { ABSORB_AWAKENING_MULT, AGI_SCALE, BASE_ABSORB, CRIT_PER_DEX, FRENZY_PER_BUY, HUNGER_DPS_BONUS, MAX_KILLS_PER_TICK, MND_SCALE } from "../content/combat";
import { FEED_PER_KILL, HUNGER_SOUL_BONUS } from "../content/hunger";
import { spawnEnemy } from "../content/enemies";
import { GameState, STAT_ORDER } from "../state/types";
import { Decimal, D, ONE, ZERO } from "./decimal";
import { greedMult } from "./greed";
import { hungerRatio } from "./hunger";
import { digestMult } from "./reset";
import { rankMult } from "./ranks";
import { essenceAbsorptionMult, essenceShopMult } from "./essenceShop";
import { dropSkill, skillMult } from "./skills";
import { activeModifiers } from "./modifiers";

export interface CombatReadout {
  dps: Decimal;
  perKill: Decimal;
  absorbRate: Decimal;
  hungerRatio: number;
}

export function currentHungerRatio(state: GameState): number {
  return hungerRatio(state);
}

export function computeGlobalMult(state: GameState): Decimal {
  return digestMult(state.gluttonyLevel)
    .mul(rankMult(state))
    .mul(essenceShopMult(state));
}

export function computeDps(state: GameState): Decimal {
  const str = state.stats.STR.value;
  const mag = state.stats.MAG.value;
  const dex = state.stats.DEX.value;
  const agi = state.stats.AGI.value;
  const critMult = ONE.add(dex.mul(CRIT_PER_DEX));
  const frenzyMult = ONE.add(agi.div(AGI_SCALE)).mul(D(FRENZY_PER_BUY).pow(state.frenzyBought));
  const hungerCombatMult = ONE.add(D(currentHungerRatio(state)).mul(HUNGER_DPS_BONUS));

  return str
    .add(mag)
    .mul(critMult)
    .mul(frenzyMult)
    .mul(greedMult(state))
    .mul(skillMult(state))
    .mul(hungerCombatMult)
    .mul(computeGlobalMult(state))
    .mul(activeModifiers(state).dpsMult);
}

export function absorbRate(state: GameState): Decimal {
  return D(BASE_ABSORB)
    .mul(D(ABSORB_AWAKENING_MULT).pow(state.awakenings))
    .mul(ONE.add(state.stats.MND.value.div(MND_SCALE)))
    .mul(essenceAbsorptionMult(state))
    .mul(activeModifiers(state).absorbMult);
}

export function soulsPerKill(state: GameState): Decimal {
  return state.current.soulValue.mul(ONE.add(D(currentHungerRatio(state)).mul(HUNGER_SOUL_BONUS))).mul(computeGlobalMult(state));
}

export function combatReadout(state: GameState): CombatReadout {
  return {
    dps: computeDps(state),
    perKill: soulsPerKill(state),
    absorbRate: absorbRate(state),
    hungerRatio: currentHungerRatio(state),
  };
}

export function killEnemy(state: GameState): void {
  const current = state.current;
  const gainedSouls = soulsPerKill(state);
  const rate = absorbRate(state);

  state.souls = state.souls.add(gainedSouls);

  for (const stat of STAT_ORDER) {
    state.stats[stat].value = state.stats[stat].value.add(current.stats[stat].mul(rate));
  }

  if (current.skillDropId) dropSkill(state, current.skillDropId);

  state.hunger = Math.max(0, state.hunger - FEED_PER_KILL);
  state.totalKills = state.totalKills.add(ONE);
  state.current = spawnEnemy(state.zone, state.totalKills);
}

export function tickCombat(state: GameState, deltaSec: number): void {
  const dps = computeDps(state);
  if (dps.lte(ZERO)) return;

  let damage = dps.mul(deltaSec);
  let kills = 0;

  while (damage.gt(ZERO) && kills < MAX_KILLS_PER_TICK) {
    if (damage.gte(state.current.hp)) {
      damage = damage.sub(state.current.hp);
      killEnemy(state);
      kills += 1;
    } else {
      state.current.hp = state.current.hp.sub(damage);
      damage = ZERO;
    }
  }
}
