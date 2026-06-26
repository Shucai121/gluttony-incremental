import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { appraisalNodeById } from "../src/content/appraisal";
import {
  appraisalCost,
  appraisalLevel,
  appraisalZoneCap,
  buyAppraisal,
  canBuyAppraisal,
  isAppraised,
} from "../src/engine/appraisal";
import { canAdvanceZone } from "../src/engine/zones";

describe("appraisal content + shop", () => {
  it("resolves nodes and prices the first level at base cost", () => {
    const state = defaultState();
    expect(appraisalNodeById("deep-sight")).not.toBeNull();
    expect(appraisalCost(state, "deep-sight").eq(25)).toBe(true);
  });

  it("gates purchase on Sin Essence and spends it", () => {
    const state = defaultState();
    state.sinEssence = D(24);
    expect(canBuyAppraisal(state, "deep-sight")).toBe(false);
    state.sinEssence = D(25);
    expect(buyAppraisal(state, "deep-sight")).toBe(true);
    expect(state.sinEssence.eq(0)).toBe(true);
    expect(appraisalLevel(state, "deep-sight")).toBe(1);
  });

  it("predator-eye flips the appraised flag and caps at maxLevel", () => {
    const state = defaultState();
    state.sinEssence = D(1000);
    expect(isAppraised(state)).toBe(false);
    expect(buyAppraisal(state, "predator-eye")).toBe(true);
    expect(isAppraised(state)).toBe(true);
    expect(canBuyAppraisal(state, "predator-eye")).toBe(false); // maxLevel 1
  });
});

describe("appraisal gates zone depth", () => {
  it("defaults to the free-zone cap and extends with deep-sight", () => {
    const state = defaultState();
    expect(appraisalZoneCap(state)).toBe(5);
    state.sinEssence = D(1000);
    buyAppraisal(state, "deep-sight");
    expect(appraisalZoneCap(state)).toBe(8);
  });

  it("blocks advancing past the appraisal cap even with VIT and kills to spare", () => {
    const state = defaultState();
    state.zone = 5;
    state.stats.VIT.value = D("1e9"); // VIT depth gate wide open
    state.totalKills = D("1e9"); // kill requirement satisfied
    expect(canAdvanceZone(state)).toBe(false); // appraisal cap 5 -> cannot reach 6
    state.sinEssence = D(1000);
    buyAppraisal(state, "deep-sight"); // cap -> 8
    expect(canAdvanceZone(state)).toBe(true);
  });
});
