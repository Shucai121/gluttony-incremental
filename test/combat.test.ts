import { describe, expect, it } from "vitest";
import { spawnEnemy } from "../src/content/enemies";
import { D, ZERO } from "../src/engine/decimal";
import { computeGlobalMult, tickCombat } from "../src/engine/combat";
import { buyMaxTraining } from "../src/engine/training";
import { buyPerk } from "../src/engine/perks";
import { checkAchievements } from "../src/engine/achievements";
import { defaultState } from "../src/state/store";

describe("combat and devour engine", () => {
  it("kills enemies, grants souls, and absorbs stats deterministically", () => {
    const state = defaultState();
    state.stats.STR.value = D(100);
    state.current = spawnEnemy(0, ZERO);

    tickCombat(state, 0.1);

    expect(state.totalKills.eq(1)).toBe(true);
    expect(state.souls.eq(1)).toBe(true);
    expect(state.stats.STR.value.eq(D(100).add("0.02"))).toBe(true);
    expect(state.current.hp.eq(state.current.maxHp)).toBe(true);
  });

  it("buy max training spends the geometric batch cost without overspending", () => {
    const state = defaultState();
    state.souls = D(100);

    const bought = buyMaxTraining(state, "STR");

    expect(bought.eq(4)).toBe(true);
    expect(state.stats.STR.trained.eq(4)).toBe(true);
    expect(state.stats.STR.value.eq(5)).toBe(true);
    expect(state.souls.toNumber()).toBeCloseTo(7.44, 6);
  });

  it("folds Domain Perks and Achievements into the global multiplier", () => {
    const state = defaultState();
    const base = computeGlobalMult(state);
    expect(base.eq(1)).toBe(true);

    state.divinity = D(1);
    buyPerk(state, "domain-power"); // x5

    state.gluttonyLevel = D(1); // unlocks first-digest achievement x1.1
    checkAchievements(state);
    state.gluttonyLevel = D(0); // revert so digestMult stays 1 — achievement is latched

    expect(computeGlobalMult(state).eq(D(5).mul(1.1))).toBe(true);
  });
});
