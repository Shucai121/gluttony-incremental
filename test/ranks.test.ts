import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { rankMult, rankName, updateDevourerRank } from "../src/engine/ranks";

describe("devourer rank", () => {
  it("starts at rank E with x1 multiplier", () => {
    const state = defaultState();
    expect(rankName(state)).toBe("E");
    expect(rankMult(state).eq(1)).toBe(true);
  });

  it("ranks up on cumulative sin essence thresholds (3^index multiplier)", () => {
    const state = defaultState();
    state.sinEssence = D(50); // threshold for rank D (index 1)
    updateDevourerRank(state);
    expect(state.devourerRank).toBe(1);
    expect(rankName(state)).toBe("D");
    expect(rankMult(state).eq(3)).toBe(true);

    state.sinEssence = D("5e3"); // rank C (index 2)
    updateDevourerRank(state);
    expect(rankMult(state).eq(9)).toBe(true);
  });

  it("ratchets: spending essence below a threshold never lowers rank", () => {
    const state = defaultState();
    state.sinEssence = D("5e3");
    updateDevourerRank(state);
    expect(state.devourerRank).toBe(2);

    state.sinEssence = D(0); // spent it all in the shop
    updateDevourerRank(state);
    expect(state.devourerRank).toBe(2); // unchanged
  });
});
