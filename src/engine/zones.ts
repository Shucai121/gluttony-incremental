import { ZONE_KILL_BASE, ZONE_KILL_MULT, ZONE_VIT_PER_DEPTH } from "../content/zones";
import { spawnEnemy } from "../content/enemies";
import { GameState } from "../state/types";
import { Decimal, geometricCost } from "./decimal";
import { appraisalZoneCap } from "./appraisal";

export function zoneKillRequirement(nextZone: number): Decimal {
  return geometricCost(ZONE_KILL_BASE, ZONE_KILL_MULT, nextZone);
}

export function maxSafeZone(state: GameState): number {
  return Math.floor(state.stats.VIT.value.div(ZONE_VIT_PER_DEPTH).toNumber());
}

export function canAdvanceZone(state: GameState): boolean {
  const nextZone = state.zone + 1;
  return (
    state.totalKills.gte(zoneKillRequirement(nextZone)) &&
    maxSafeZone(state) >= nextZone &&
    appraisalZoneCap(state) >= nextZone
  );
}

export function advanceZone(state: GameState): boolean {
  if (!canAdvanceZone(state)) return false;

  state.zone += 1;
  state.maxZone = Math.max(state.maxZone, state.zone);
  state.current = spawnEnemy(state.zone, state.totalKills);
  return true;
}
