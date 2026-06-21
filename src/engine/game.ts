import { GameState } from "../state/types";
import { defaultState, deepMerge, migrate } from "../state/store";
import { loadRaw, saveGame } from "./save";
import { startLoop } from "./loop";

/** The live, mutable game state. The loop mutates this directly (fast, no React churn). */
export const game: { state: GameState; ticks: number } = {
  state: deepMerge(defaultState(), migrate(loadRaw() ?? {})),
  ticks: 0,
};

let sinceSaveSec = 0;

function tick(deltaSec: number): void {
  game.ticks += 1;

  // Phase 2+: combat / devour / hunger / training updates go here.

  sinceSaveSec += deltaSec;
  if (sinceSaveSec >= game.state.settings.autosaveSec) {
    sinceSaveSec = 0;
    game.state.lastSave = Date.now();
    saveGame(game.state);
  }
}

/** Start the fixed-timestep loop. `onFrame` is called once per logical tick (for UI sampling). */
export function startGame(onFrame: () => void): () => void {
  return startLoop((deltaSec) => {
    tick(deltaSec);
    onFrame();
  });
}

export function hardReset(): void {
  game.state = defaultState();
  game.ticks = 0;
  saveGame(game.state);
}
