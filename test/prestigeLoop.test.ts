import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { tickCombat } from "../src/engine/combat";
import { canFeedingFrenzy, feedingFrenzy } from "../src/engine/reset";
import { buyEssenceUpgrade, canBuyEssenceUpgrade } from "../src/engine/essenceShop";

// Phase 5 is the project's risky checkpoint: the first prestige loop. These
// end-to-end tests guard the criterion that each Frenzy -> spend -> next run
// is demonstrably stronger, not just that the units compute in isolation.

function fightFor(state: ReturnType<typeof defaultState>, ticks: number): void {
  for (let i = 0; i < ticks; i++) tickCombat(state, 1);
}

describe("Phase 5 prestige loop pays off (risky checkpoint)", () => {
  it("a Feeding Frenzy banks Sin Essence, ratchets Devourer Rank, and resets the run", () => {
    const state = defaultState();
    state.stats.STR.value = D(100);
    fightFor(state, 50);
    expect(state.totalKills.gt(0)).toBe(true);

    // A deep run's haul, gorged to the brim.
    state.souls = D("1e75");
    state.hunger = state.hungerMax;
    expect(canFeedingFrenzy(state)).toBe(true);

    const killsBefore = state.totalKills;
    const gain = feedingFrenzy(state);

    expect(gain.gte(50)).toBe(true); // crosses the rank-D threshold (50)
    expect(state.sinEssence.eq(gain)).toBe(true);
    expect(state.devourerRank).toBe(1); // ratcheted E -> D
    expect(state.totalKills.lt(killsBefore)).toBe(true); // run was reset
    expect(state.souls.lt("1e75")).toBe(true);
    expect(canBuyEssenceUpgrade(state, "gluttonys-might")).toBe(true);
  });

  it("after spending Sin Essence, an identical run climbs faster", () => {
    const baseline = defaultState();
    baseline.stats.STR.value = D(100);
    fightFor(baseline, 120);

    // Same starting power, but with prestige rewards spent:
    // rank D (x3 global) + Gluttony's Might (x1.5 global).
    const empowered = defaultState();
    empowered.stats.STR.value = D(100);
    empowered.devourerRank = 1;
    empowered.sinEssence = D(10);
    expect(buyEssenceUpgrade(empowered, "gluttonys-might")).toBe(true);
    fightFor(empowered, 120);

    expect(empowered.totalKills.gt(baseline.totalKills)).toBe(true);
    expect(empowered.souls.gt(baseline.souls)).toBe(true);
  });
});
