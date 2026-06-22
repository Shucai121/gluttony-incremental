import { describe, expect, it } from "vitest";
import { encode, decode } from "../src/engine/save";
import { D } from "../src/engine/decimal";
import { absorbRate, computeDps } from "../src/engine/combat";
import { tickHunger } from "../src/engine/hunger";
import { digest, awaken } from "../src/engine/reset";
import { advanceZone } from "../src/engine/zones";
import { defaultState, deepMerge, migrate } from "../src/state/store";

describe("phase 3 hunger, zones, and resets", () => {
  it("raises hunger over time with MND reduction", () => {
    const state = defaultState();
    tickHunger(state, 1);
    expect(state.hunger).toBeCloseTo(4, 6);

    state.hunger = 0;
    state.stats.MND.value = D(1000);
    tickHunger(state, 1);
    expect(state.hunger).toBeCloseTo(2, 6);
  });

  it("advances zones and respawns a stronger enemy", () => {
    const state = defaultState();
    const hpBefore = state.current.maxHp;
    const soulsBefore = state.current.soulValue;
    state.totalKills = D(20);
    state.stats.VIT.value = D(2);

    expect(advanceZone(state)).toBe(true);
    expect(state.zone).toBe(1);
    expect(state.current.maxHp.gt(hpBefore)).toBe(true);
    expect(state.current.soulValue.gt(soulsBefore)).toBe(true);
  });

  it("digests the run and keeps a global multiplier", () => {
    const state = defaultState();
    const dpsBefore = computeDps(state);
    state.totalKills = D(25);

    expect(digest(state)).toBe(true);
    expect(state.gluttonyLevel.eq(1)).toBe(true);
    expect(state.souls.eq(0)).toBe(true);
    expect(state.zone).toBe(0);
    expect(state.totalKills.eq(0)).toBe(true);
    expect(computeDps(state).gt(dpsBefore)).toBe(true);
  });

  it("awakens gluttony, clears digest levels, and steepens absorption", () => {
    const state = defaultState();
    const rateBefore = absorbRate(state);
    state.gluttonyLevel = D(3);

    expect(awaken(state)).toBe(true);
    expect(state.gluttonyLevel.eq(0)).toBe(true);
    expect(state.awakenings.eq(1)).toBe(true);
    expect(absorbRate(state).gt(rateBefore)).toBe(true);
  });

  it("save load preserves hunger, zone, gluttony level, and awakenings", () => {
    const state = defaultState();
    state.hunger = 42;
    state.zone = 2;
    state.maxZone = 3;
    state.gluttonyLevel = D(4);
    state.awakenings = D(1);

    const wire = JSON.parse(JSON.stringify(encode(state)));
    const loaded = deepMerge(defaultState(), migrate(decode(wire)));

    expect(loaded.hunger).toBe(42);
    expect(loaded.zone).toBe(2);
    expect(loaded.maxZone).toBe(3);
    expect(loaded.gluttonyLevel.eq(4)).toBe(true);
    expect(loaded.awakenings.eq(1)).toBe(true);
  });
});
