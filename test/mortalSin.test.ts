import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { canMortalSin, mortalSinAwaken, mortalSinGain } from "../src/engine/mortalSin";
import { MORTAL_SIN_RANK } from "../src/content/mortalSin";

describe("mortal sin awakening", () => {
  it("is gated on reaching Devourer Rank S", () => {
    const state = defaultState();
    state.devourerRank = MORTAL_SIN_RANK - 1;
    expect(canMortalSin(state)).toBe(false);
    state.devourerRank = MORTAL_SIN_RANK;
    expect(canMortalSin(state)).toBe(true);
  });

  it("gain is floor(sqrt(sinEssence))", () => {
    const state = defaultState();
    state.sinEssence = D("1e12");
    expect(mortalSinGain(state).eq("1e6")).toBe(true);
  });

  it("awakening banks Sins, increments mortalSins, and clears layers 2-5 while keeping skills/tree", () => {
    const state = defaultState();
    state.devourerRank = MORTAL_SIN_RANK;
    state.sinEssence = D("1e12");
    state.essenceUpgrades = { "gluttonys-might": 5 };
    state.souls = D(1000);
    state.gluttonyLevel = D(7);
    state.greed = { form: 3, bloodCharge: D(50) };
    state.skills = { "rending-claw": { level: 2, equipped: true } };
    state.sinTree = { "restraint-1": true };
    state.autobuyers = { "auto-train": { unlocked: true, enabled: true, priority: 0 } };

    const gain = mortalSinAwaken(state);

    expect(gain.eq("1e6")).toBe(true);
    expect(state.sins.eq("1e6")).toBe(true);
    expect(state.mortalSins.eq(1)).toBe(true);
    // CLEARED (Mortal Sin column)
    expect(state.sinEssence.eq(0)).toBe(true);
    expect(state.devourerRank).toBe(0);
    expect(state.essenceUpgrades).toEqual({});
    expect(state.souls.eq(0)).toBe(true);
    expect(state.gluttonyLevel.eq(0)).toBe(true);
    expect(state.greed.form).toBe(0);
    // KEPT
    expect(state.skills["rending-claw"].level).toBe(2);
    expect(state.sinTree["restraint-1"]).toBe(true);
    expect(state.autobuyers["auto-train"].unlocked).toBe(true);
  });

  it("does nothing below Rank S", () => {
    const state = defaultState();
    state.sinEssence = D("1e12");
    expect(mortalSinAwaken(state).eq(0)).toBe(true);
    expect(state.mortalSins.eq(0)).toBe(true);
  });
});
