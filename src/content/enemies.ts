import { Decimal, D } from "../engine/decimal";
import { EnemyState, StatId, STAT_ORDER } from "../state/types";

const ENEMY_HP_BASE = "1e1";
const ENEMY_HP_KILL_MULT = "1.15";
const ENEMY_HP_ZONE_MULT = "8";
const ENEMY_SOUL_BASE = "1e0";
const ENEMY_SOUL_KILL_MULT = "1.12";
const ENEMY_SOUL_ZONE_MULT = "5";
const ENEMY_STAT_BASE = "1e0";
const ENEMY_STAT_KILL_MULT = "1.13";
const ENEMY_STAT_ZONE_MULT = "6";

export function spawnEnemy(zone: number, totalKills: Decimal): EnemyState {
  const killPower = D(totalKills);
  const zonePower = D(zone);
  const maxHp = D(ENEMY_HP_BASE).mul(D(ENEMY_HP_KILL_MULT).pow(killPower)).mul(D(ENEMY_HP_ZONE_MULT).pow(zonePower));
  const soulValue = D(ENEMY_SOUL_BASE)
    .mul(D(ENEMY_SOUL_KILL_MULT).pow(killPower))
    .mul(D(ENEMY_SOUL_ZONE_MULT).pow(zonePower));
  const statValue = D(ENEMY_STAT_BASE)
    .mul(D(ENEMY_STAT_KILL_MULT).pow(killPower))
    .mul(D(ENEMY_STAT_ZONE_MULT).pow(zonePower));
  const stats = {} as Record<StatId, Decimal>;

  for (const stat of STAT_ORDER) {
    stats[stat] = statValue;
  }

  return {
    hp: maxHp,
    maxHp,
    soulValue,
    tier: zone,
    stats,
    skillDropId: null,
  };
}
