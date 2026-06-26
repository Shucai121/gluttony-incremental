import { AUTOBUYERS, autobuyerById } from "../content/autobuyers";
import { GameState, STAT_ORDER } from "../state/types";
import { buyMaxTraining } from "./training";
import { advanceZone, canAdvanceZone } from "./zones";
import { canDigest, digest } from "./reset";

export function isAutobuyerActive(state: GameState, id: string): boolean {
  const a = state.autobuyers[id];
  return !!a && a.unlocked && a.enabled;
}

export function canUnlockAutobuyer(state: GameState, id: string): boolean {
  const def = autobuyerById(id);
  if (!def) return false;
  if (state.autobuyers[id]?.unlocked) return false;
  return state.sinEssence.gte(def.unlockCost);
}

export function unlockAutobuyer(state: GameState, id: string): boolean {
  if (!canUnlockAutobuyer(state, id)) return false;
  const def = autobuyerById(id)!;
  state.sinEssence = state.sinEssence.sub(def.unlockCost);
  state.autobuyers[id] = { unlocked: true, enabled: true, priority: def.defaultPriority };
  return true;
}

export function setAutobuyerEnabled(state: GameState, id: string, enabled: boolean): void {
  const a = state.autobuyers[id];
  if (a?.unlocked) a.enabled = enabled;
}

function runAutobuyer(state: GameState, id: string): void {
  switch (id) {
    case "auto-train":
      for (const stat of STAT_ORDER) buyMaxTraining(state, stat);
      break;
    case "auto-dive": {
      let guard = 0;
      while (canAdvanceZone(state) && guard < 100) {
        advanceZone(state);
        guard += 1;
      }
      break;
    }
    case "auto-digest":
      if (canDigest(state)) digest(state);
      break;
  }
}

/** Run every unlocked + enabled autobuyer, lowest priority first. */
export function tickAutobuyers(state: GameState): void {
  const active = AUTOBUYERS.map((d) => d.id)
    .filter((id) => isAutobuyerActive(state, id))
    .sort((a, b) => state.autobuyers[a].priority - state.autobuyers[b].priority);
  for (const id of active) runAutobuyer(state, id);
}
