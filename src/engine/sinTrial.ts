import { sinById } from "../content/sins";
import { GameState } from "../state/types";
import { resetRun } from "./reset";
import { dropSkill } from "./skills";

export function isTrialCleared(state: GameState, id: string): boolean {
  return state.sinTrials[id]?.cleared ?? false;
}

export function isInTrial(state: GameState): boolean {
  return state.activeTrial !== null;
}

export function canEnterTrial(state: GameState, id: string): boolean {
  return sinById(id) !== null && state.activeTrial === null;
}

/**
 * Enter a Sin Trial: the run resets into a fresh, constrained sandbox. Run-scope
 * state is wiped on the way in (and again on exit), so nothing leaks into the
 * main save — only the persistent reward (cleared flag + Sin Skill) survives.
 */
export function enterTrial(state: GameState, id: string): boolean {
  if (!canEnterTrial(state, id)) return false;
  const entry = state.sinTrials[id] ?? { unlocked: true, cleared: false };
  entry.unlocked = true;
  state.sinTrials[id] = entry;
  state.activeTrial = id;
  resetRun(state);
  return true;
}

export function exitTrial(state: GameState): void {
  if (state.activeTrial === null) return;
  state.activeTrial = null;
  resetRun(state);
}

/** Called each tick: if the active trial's clear condition is met, reward once and exit. */
export function checkTrialClear(state: GameState): boolean {
  const id = state.activeTrial;
  if (!id) return false;
  const sin = sinById(id);
  if (!sin) return false;
  if (state.totalKills.lt(sin.clearKills)) return false;

  const entry = state.sinTrials[id] ?? { unlocked: true, cleared: false };
  const firstClear = !entry.cleared;
  entry.cleared = true;
  state.sinTrials[id] = entry;
  if (firstClear) dropSkill(state, sin.rewardSkillId);

  exitTrial(state);
  return true;
}
