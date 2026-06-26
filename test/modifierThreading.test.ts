import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { absorbRate, computeDps } from "../src/engine/combat";
import { tickHunger } from "../src/engine/hunger";
import { buyTraining } from "../src/engine/training";
import { buyAppraisal } from "../src/engine/appraisal";
import { enterTrial } from "../src/engine/sinTrial";

describe("trial constraints thread through the engine via modifiers", () => {
  it("Sloth halves computeDps", () => {
    const state = defaultState();
    state.stats.STR.value = D(100);
    const normal = computeDps(state);
    enterTrial(state, "sloth");
    state.stats.STR.value = D(100); // restore (enterTrial reset the run)
    expect(computeDps(state).eq(normal.mul("0.5"))).toBe(true);
  });

  it("Lust halves absorbRate", () => {
    const state = defaultState();
    const normal = absorbRate(state);
    enterTrial(state, "lust");
    expect(absorbRate(state).eq(normal.mul("0.5"))).toBe(true);
  });

  it("Wrath doubles the hunger gained per second", () => {
    const normal = defaultState();
    tickHunger(normal, 1);

    const trial = defaultState();
    enterTrial(trial, "wrath");
    tickHunger(trial, 1);

    expect(trial.hunger).toBeCloseTo(normal.hunger * 2, 6);
  });

  it("Envy forbids Training", () => {
    const state = defaultState();
    enterTrial(state, "envy");
    state.souls = D("1e6");
    expect(buyTraining(state, "STR")).toBe(false);
    expect(state.stats.STR.trained.eq(0)).toBe(true);
  });

  it("Greed seals Appraisal", () => {
    const state = defaultState();
    enterTrial(state, "greed");
    state.sinEssence = D("1e6");
    expect(buyAppraisal(state, "deep-sight")).toBe(false);
  });
});
