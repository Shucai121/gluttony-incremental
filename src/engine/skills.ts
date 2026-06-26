import { LOADOUT_SIZE, skillById } from "../content/skills";
import { GameState } from "../state/types";
import { Decimal, ONE } from "./decimal";

export function skillLevel(state: GameState, id: string): number {
  return state.skills[id]?.level ?? 0;
}

export function isEquipped(state: GameState, id: string): boolean {
  return state.skills[id]?.equipped ?? false;
}

export function equippedCount(state: GameState): number {
  let n = 0;
  for (const id of Object.keys(state.skills)) if (state.skills[id].equipped) n += 1;
  return n;
}

/** Devour-drop a skill: first time owns it at level 1; subsequent drops level it up. */
export function dropSkill(state: GameState, id: string): void {
  if (!skillById(id)) return;
  const owned = state.skills[id];
  if (owned) owned.level += 1;
  else state.skills[id] = { level: 1, equipped: false };
}

export function equipSkill(state: GameState, id: string): boolean {
  const owned = state.skills[id];
  if (!owned) return false;
  if (owned.equipped) return true;
  if (equippedCount(state) >= LOADOUT_SIZE) return false;
  owned.equipped = true;
  return true;
}

export function unequipSkill(state: GameState, id: string): void {
  const owned = state.skills[id];
  if (owned) owned.equipped = false;
}

/** Product of every equipped dps skill's multPerLevel ^ level. */
export function skillMult(state: GameState): Decimal {
  let mult = ONE;
  for (const id of Object.keys(state.skills)) {
    const owned = state.skills[id];
    if (!owned.equipped) continue;
    const def = skillById(id);
    if (def && def.kind === "dps") mult = mult.mul(def.multPerLevel.pow(owned.level));
  }
  return mult;
}
