import { GameState } from "../state/types";
import { defaultState, deepMerge, migrate } from "../state/store";
import { loadRaw, saveGame } from "./save";
import { startLoop } from "./loop";
import { setNotation } from "./format";
import { stepEngine } from "./step";
import { applyOfflineProgress } from "./offline";

/** live, mutable game state. loop mutates directly (fast, no React churn). */
export const game: { state: GameState; ticks: number } = {
  state: deepMerge(defaultState(), migrate(loadRaw() ?? {})),
  ticks: 0,
};

// Apply the saved display notation at boot.
setNotation(game.state.settings.notation);

// Catch up the time the tab was closed (capped) before the live loop starts.
applyOfflineProgress(game.state, (Date.now() - game.state.lastSave) / 1000);

let sinceSaveSec = 0;

export function tick(deltaSec: number): void {
  game.ticks += 1;
  stepEngine(game.state, deltaSec);

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
