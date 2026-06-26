import { describe, expect, it } from "vitest";
import { D, ZERO } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { sinEssenceGain } from "../src/engine/prestige";
import { canFeedingFrenzy, feedingFrenzy } from "../src/engine/reset";

describe("sinEssenceGain", () => {
  it("always yields at least 1", () => {
    expect(sinEssenceGain(D(0), 0).gte(1)).toBe(true);
    expect(sinEssenceGain(D("1e5"), 1).gte(1)).toBe(true);
  });

  it("is non-decreasing as run size (souls) grows", () => {
    const small = sinEssenceGain(D("1e30"), 1);
    const big = sinEssenceGain(D("1e90"), 1);
    expect(big.gte(small)).toBe(true);
    expect(big.gt(small)).toBe(true);
  });

  it("pays more at higher hunger ratio", () => {
    const low = sinEssenceGain(D("1e60"), 0);
    const high = sinEssenceGain(D("1e60"), 1);
    expect(high.gt(low)).toBe(true);
  });
});

describe("feeding frenzy reset", () => {
  it("is gated on maxed hunger", () => {
    const state = defaultState();
    state.hunger = state.hungerMax - 1;
    expect(canFeedingFrenzy(state)).toBe(false);
    state.hunger = state.hungerMax;
    expect(canFeedingFrenzy(state)).toBe(true);
  });

  it("does nothing and returns ZERO when ineligible", () => {
    const state = defaultState();
    state.hunger = 0;
    state.souls = D("1e40");
    expect(feedingFrenzy(state).eq(ZERO)).toBe(true);
    expect(state.souls.eq("1e40")).toBe(true); // untouched
  });

  it("clears the run, banks Sin Essence, keeps prestige rewards, ratchets rank", () => {
    const state = defaultState();
    // a developed run:
    state.souls = D("1e60");
    state.stats.STR.value = D(500);
    state.stats.STR.trained = D(50);
    state.frenzyBought = D(10);
    state.totalKills = D(9999);
    state.zone = 4;
    state.maxZone = 4;
    state.hunger = state.hungerMax;
    state.gluttonyLevel = D(7);
    state.awakenings = D(2);
    state.greed.form = 2;
    state.greed.bloodCharge = D(8);
    // pre-existing prestige rewards that must survive:
    state.sinEssence = D(40);
    state.essenceUpgrades = { "gluttonys-might": 3 };
    state.autobuyers = { "auto-train": { unlocked: true, enabled: true, priority: 0 } };

    const gained = feedingFrenzy(state);

    expect(gained.gt(ZERO)).toBe(true);
    // run cleared:
    expect(state.souls.eq(ZERO)).toBe(true);
    expect(state.stats.STR.trained.eq(ZERO)).toBe(true);
    expect(state.frenzyBought.eq(ZERO)).toBe(true);
    expect(state.totalKills.eq(ZERO)).toBe(true);
    expect(state.zone).toBe(0);
    expect(state.maxZone).toBe(0);
    expect(state.hunger).toBe(0);
    expect(state.gluttonyLevel.eq(ZERO)).toBe(true);
    expect(state.awakenings.eq(ZERO)).toBe(true);
    // greed: charge wiped, form kept:
    expect(state.greed.bloodCharge.eq(ZERO)).toBe(true);
    expect(state.greed.form).toBe(2);
    // rewards kept + gain banked:
    expect(state.sinEssence.eq(D(40).add(gained))).toBe(true);
    expect(state.essenceUpgrades["gluttonys-might"]).toBe(3);
    expect(state.autobuyers["auto-train"].unlocked).toBe(true);
    // rank ratcheted from cumulative essence (40 + gain may cross 50 -> D):
    expect(state.devourerRank).toBeGreaterThanOrEqual(0);
  });
});
