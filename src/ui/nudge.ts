import { GameState, STAT_ORDER } from "../state/types";
import { REVEAL } from "../content/ui";

// Returns the first unmet objective's skill-voice line, or null when none remain.
export function nextObjective(state: GameState): string | null {
  if (state.totalKills.lt(1)) {
    return "『 Let your hunger devour the foe before you. 』";
  }
  if (state.sinEssence.lte(0) && state.hunger >= state.hungerMax) {
    return "『 You are gorged. Loose the Feeding Frenzy. 』";
  }
  const trainedAny = STAT_ORDER.some((s) => state.stats[s].trained.gt(0));
  if (state.souls.gt(0) && !trainedAny) {
    return "『 Spend Souls — devour Strength into your own. 』";
  }
  if (state.totalKills.lt(REVEAL.zoneKills)) {
    return "『 Cull more prey to open the path deeper. 』";
  }
  if (state.maxZone < 1) {
    return "『 Hunt deeper. Advance a zone. 』";
  }
  if (state.gluttonyLevel.lt(1) && state.totalKills.gte(REVEAL.gluttonyKills)) {
    return "『 The skill strains to deepen. Digest. 』";
  }
  return null;
}
