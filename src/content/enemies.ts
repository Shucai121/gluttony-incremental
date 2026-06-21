import { Decimal, D } from "../engine/decimal";
import { EnemyState, StatId, STAT_ORDER } from "../state/types";

/**
 * Phase 1 placeholder. Phase 2 replaces the body with the geometric scaling in SPEC §6:
 *   maxHp     = 1e1 * 1.15^totalKills * 8^zone
 *   soulValue = 1e0 * 1.12^totalKills * 5^zone
 *   stats[s]  = 1e0 * 1.13^totalKills * 6^zone
 * and rolls skillDropId from the zone's drop table.
 */
export function spawnEnemy(zone: number, _totalKills: Decimal): EnemyState {
  const stats = {} as Record<StatId, Decimal>;
  for (const s of STAT_ORDER) stats[s] = D(1);
  const maxHp = D(10);
  return { hp: maxHp, maxHp, soulValue: D(1), tier: zone, stats, skillDropId: null };
}
