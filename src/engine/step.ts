import { GameState } from "../state/types";
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

/**
 * Advance the world one logical step. Single source of truth shared by the live loop
 * (game.tick), offline catch-up, and the integration sim — so all three behave identically.
 */
export function stepEngine(state: GameState, deltaSec: number): void {
  tickHunger(state, deltaSec);
  tickGreed(state, deltaSec);
  tickCombat(state, deltaSec);
  checkTrialClear(state);
  tickAutobuyers(state);
  for (const id of checkAchievements(state)) {
    emit({ type: "achievement", name: achievementById(id)?.name ?? id });
  }
  for (const id of checkTitles(state)) {
    emit({ type: "title", name: titleById(id)?.name ?? id });
  }
}
