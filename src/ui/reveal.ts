import { GameState } from "../state/types";
import { REVEAL } from "../content/ui";

export type Panel = "foe" | "status" | "training" | "zone" | "gluttony";

export const PANELS: readonly Panel[] = ["foe", "status", "training", "zone", "gluttony"];

// Reads only monotonic state (totalKills) so panel never un-reveals after souls are spent.
export function isRevealed(panel: Panel, state: GameState): boolean {
  switch (panel) {
    case "foe":
    case "status":
      return true;
    case "training":
      return state.totalKills.gte(REVEAL.trainingKills);
    case "zone":
      return state.totalKills.gte(REVEAL.zoneKills);
    case "gluttony":
      return state.totalKills.gte(REVEAL.gluttonyKills);
    default:
      return false;
  }
}

export const REVEAL_COPY: Record<Panel, string> = {
  foe: "",
  status: "",
  training: "『 Strength can be devoured. Spend. 』",
  zone: "『 prey beneath you. Hunt deeper. 』",
  gluttony: "『 skill deepens. Digest what you are. 』",
};
