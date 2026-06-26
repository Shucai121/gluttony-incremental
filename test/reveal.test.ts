import { describe, it, expect } from "vitest";
import { defaultState } from "../src/state/store";
import { D, ZERO } from "../src/engine/decimal";
import { isRevealed, PANELS, REVEAL_COPY } from "../src/ui/reveal";

describe("isRevealed", () => {
  it("always reveals foe and status on a fresh save", () => {
    const s = defaultState();
    expect(isRevealed("foe", s)).toBe(true);
    expect(isRevealed("status", s)).toBe(true);
  });

  it("hides training, zone, gluttony, greed on a fresh save", () => {
    const s = defaultState();
    expect(isRevealed("training", s)).toBe(false);
    expect(isRevealed("zone", s)).toBe(false);
    expect(isRevealed("gluttony", s)).toBe(false);
    expect(isRevealed("greed", s)).toBe(false);
  });

  it("reveals training after the first kill", () => {
    const s = defaultState();
    s.totalKills = D(1);
    expect(isRevealed("training", s)).toBe(true);
    expect(isRevealed("zone", s)).toBe(false);
  });

  it("reveals zone then gluttony as kills climb", () => {
    const s = defaultState();
    s.totalKills = D(10);
    expect(isRevealed("zone", s)).toBe(true);
    expect(isRevealed("gluttony", s)).toBe(false);
    s.totalKills = D(50);
    expect(isRevealed("gluttony", s)).toBe(true);
    expect(isRevealed("greed", s)).toBe(false);
    s.totalKills = D(100);
    expect(isRevealed("greed", s)).toBe(true);
  });

  it("exposes reveal copy for every panel", () => {
    for (const p of PANELS) {
      expect(typeof REVEAL_COPY[p]).toBe("string");
    }
  });
});

describe("frenzy panel reveal", () => {
  it("hidden before hunger maxes and before any essence", () => {
    const state = defaultState();
    state.hunger = 0;
    state.sinEssence = ZERO;
    expect(isRevealed("frenzy", state)).toBe(false);
  });

  it("revealed exactly when hunger maxes", () => {
    const state = defaultState();
    state.hunger = state.hungerMax;
    expect(isRevealed("frenzy", state)).toBe(true);
  });

  it("stays revealed after first frenzy even at zero hunger", () => {
    const state = defaultState();
    state.hunger = 0;
    state.sinEssence = D(2);
    expect(isRevealed("frenzy", state)).toBe(true);
  });
});

describe("phase 6 panel reveal", () => {
  it("hides skills until one is owned, then reveals it", () => {
    const state = defaultState();
    expect(isRevealed("skills", state)).toBe(false);
    state.skills["rending-claw"] = { level: 1, equipped: false };
    expect(isRevealed("skills", state)).toBe(true);
  });

  it("reveals appraisal and trials once Sin Essence has been earned", () => {
    const state = defaultState();
    expect(isRevealed("appraisal", state)).toBe(false);
    expect(isRevealed("trials", state)).toBe(false);
    state.sinEssence = D(1);
    expect(isRevealed("appraisal", state)).toBe(true);
    expect(isRevealed("trials", state)).toBe(true);
  });
});
