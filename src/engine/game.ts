import { GameState } from "../state/types";
import { defaultState, deepMerge, migrate } from "../state/store";
import { loadRaw, saveGame } from "./save";
import { startLoop } from "./loop";
import { tickCombat } from "./combat";
import { tickGreed } from "./greed";
import { tickHunger } from "./hunger";
import { tickAutobuyers } from "./autobuyers";
import { checkTrialClear } from "./sinTrial";
import { checkAchievements } from "./achievements";
import { checkTitles } from "./titles";
import { achievementById } from "../content/achievements";
import { titleById } from "../content/titles";
import { emit } from "./events";
import { setNotation } from "./format";

/** live, mutable game state. loop mutates directly (fast, no React churn). */
export const game: { state: GameState; ticks: number } = {
  state: deepMerge(defaultState(), migrate(loadRaw() ?? {})),
  ticks: 0,
};

// Apply the saved display notation at boot.
setNotation(game.state.settings.notation);

let sinceSaveSec = 0;

export function tick(deltaSec: number): void {
  game.ticks += 1;
  tickHunger(game.state, deltaSec);
  tickGreed(game.state, deltaSec);
  tickCombat(game.state, deltaSec);
  checkTrialClear(game.state);
  tickAutobuyers(game.state);
  for (const id of checkAchievements(game.state)) {
    emit({ type: "achievement", name: achievementById(id)?.name ?? id });
  }
  for (const id of checkTitles(game.state)) {
    emit({ type: "title", name: titleById(id)?.name ?? id });
  }

  sinceSaveSec += deltaSec;
  if (sinceSaveSec >= game.state.settings.autosaveSec) {
    sinceSaveSec = 0;
    game.state.lastSave = Date.now();
    saveGame(game.state);
  }
}

/** Start fixed-timestep loop. `onFrame` called once per logical tick (for UI sampling). */
export function startGame(onFrame: () => void): () => void {
  return startLoop((deltaSec) => {
    tick(deltaSec);
    onFrame();
  });
}

export function hardReset(): void {
  game.state = defaultState();
  game.ticks = 0;
  sinceSaveSec = 0;
  saveGame(game.state);
}
