import { GameState } from "../state/types";
import { REVEAL } from "../content/ui";
import { ZERO } from "../engine/decimal";
import { MORTAL_SIN_RANK } from "../content/mortalSin";

export type Panel =
  | "foe"
  | "status"
  | "training"
  | "zone"
  | "gluttony"
  | "greed"
  | "frenzy"
  | "skills"
  | "appraisal"
  | "trials"
  | "mortalsin"
  | "sintree";

export const PANELS: readonly Panel[] = [
  "foe",
  "status",
  "training",
  "zone",
  "gluttony",
  "greed",
  "frenzy",
  "skills",
  "appraisal",
  "trials",
  "mortalsin",
  "sintree",
];

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
    case "skills":
      return Object.keys(state.skills).length > 0;
    case "appraisal":
    case "trials":
      return state.sinEssence.gt(ZERO);
    case "mortalsin":
      return state.devourerRank >= MORTAL_SIN_RANK || state.mortalSins.gt(ZERO);
    case "sintree":
      return state.mortalSins.gt(ZERO) || state.sins.gt(ZERO);
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
  skills: "『 A skill tears free of the devoured. It is yours now. 』",
  appraisal: "『 Your eye sharpens. Read the prey before you feast. 』",
  trials: "『 The Deadly Sins beckon. Prove your hunger against them. 』",
  mortalsin: "『 Rank S. You are ready to become something far worse. 』",
  sintree: "『 Another voice wakes within. Choose what you will become. 』",
};
