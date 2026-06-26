import { TITLES, titleById } from "../content/titles";
import { GameState } from "../state/types";

export function titleUnlocked(state: GameState, id: string): boolean {
  return state.titles.unlocked.includes(id);
}

/** Latch every title whose condition now holds. Returns newly-unlocked ids. */
export function checkTitles(state: GameState): string[] {
  const fresh: string[] = [];
  for (const title of TITLES) {
    if (!titleUnlocked(state, title.id) && title.check(state)) {
      state.titles.unlocked.push(title.id);
      fresh.push(title.id);
    }
  }
  return fresh;
}

/** Set the active (displayed) title — only if it has been unlocked. */
export function setTitle(state: GameState, id: string | null): boolean {
  if (id === null) {
    state.titles.active = null;
    return true;
  }
  if (!titleById(id) || !titleUnlocked(state, id)) return false;
  state.titles.active = id;
  return true;
}
