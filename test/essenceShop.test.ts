import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import {
  buyEssenceUpgrade,
  canBuyEssenceUpgrade,
  essenceAbsorptionMult,
  essenceShopMult,
  essenceUpgradeCost,
} from "../src/engine/essenceShop";
import { absorbRate, computeGlobalMult } from "../src/engine/combat";

describe("essence shop", () => {
  it("first level costs the base cost; multipliers default to x1", () => {
    const state = defaultState();
    expect(essenceUpgradeCost(state, "gluttonys-might").eq(5)).toBe(true);
    expect(essenceShopMult(state).eq(1)).toBe(true);
    expect(essenceAbsorptionMult(state).eq(1)).toBe(true);
  });

  it("gates purchase on Sin Essence and spends it on buy", () => {
    const state = defaultState();
    state.sinEssence = D(4);
    expect(canBuyEssenceUpgrade(state, "gluttonys-might")).toBe(false);
    state.sinEssence = D(5);
    expect(buyEssenceUpgrade(state, "gluttonys-might")).toBe(true);
    expect(state.sinEssence.eq(0)).toBe(true);
    expect(state.essenceUpgrades["gluttonys-might"]).toBe(1);
  });

  it("global upgrade multiplies the shop's global mult by 1.5 per level", () => {
    const state = defaultState();
    state.essenceUpgrades = { "gluttonys-might": 2 };
    expect(essenceShopMult(state).eq(D("1.5").pow(2))).toBe(true);
    expect(essenceAbsorptionMult(state).eq(1)).toBe(true);
  });

  it("absorption upgrade multiplies absorption mult by 1.25 per level, geometric cost", () => {
    const state = defaultState();
    expect(essenceUpgradeCost(state, "deep-absorption").eq(10)).toBe(true);
    state.essenceUpgrades = { "deep-absorption": 1 };
    expect(essenceUpgradeCost(state, "deep-absorption").eq(D(10).mul(5))).toBe(true);
    expect(essenceAbsorptionMult(state).eq(D("1.25"))).toBe(true);
  });
});

describe("essence shop and rank fold into combat", () => {
  it("rank multiplier folds into the global mult", () => {
    const state = defaultState();
    expect(computeGlobalMult(state).eq(1)).toBe(true); // rank E, no digests, no upgrades
    state.devourerRank = 1; // x3
    expect(computeGlobalMult(state).eq(3)).toBe(true);
  });

  it("global essence upgrade folds into the global mult", () => {
    const state = defaultState();
    state.essenceUpgrades = { "gluttonys-might": 1 };
    expect(computeGlobalMult(state).eq(D("1.5"))).toBe(true);
  });

  it("absorption upgrade folds into absorbRate", () => {
    const base = absorbRate(defaultState());
    const state = defaultState();
    state.essenceUpgrades = { "deep-absorption": 1 };
    expect(absorbRate(state).eq(base.mul("1.25"))).toBe(true);
  });
});
