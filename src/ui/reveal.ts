import { GameState } from "../state/types";
import { REVEAL } from "../content/ui";
import { ZERO } from "../engine/decimal";

export type Panel = "foe" | "status" | "training" | "zone" | "gluttony" | "greed" | "frenzy";

export const PANELS: readonly Panel[] = ["foe", "status", "training", "zone", "gluttony", "greed", "frenzy"];

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
    case "greed":
      return state.totalKills.gte(REVEAL.greedKills);
    case "frenzy":
      return state.hunger >= state.hungerMax || state.sinEssence.gt(ZERO);
    default:
      return false;
  }
}

export const REVEAL_COPY: Record<Panel, string> = {
  foe: "",
  status: "",
  training: "『 Strength can be devoured. Spend. 』",
  zone: "『 This prey is beneath you. Hunt deeper. 』",
  gluttony: "『 The skill deepens. Digest what you are. 』",
  greed: "『 The black sword stirs. Greed hungers beside you. 』",
  frenzy: "『 You are gorged past bearing. Let the Frenzy devour it all. 』",
};
