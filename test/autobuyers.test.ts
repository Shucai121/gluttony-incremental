import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import {
  canUnlockAutobuyer,
  setAutobuyerEnabled,
  tickAutobuyers,
  unlockAutobuyer,
} from "../src/engine/autobuyers";
import { tick, game } from "../src/engine/game";

describe("greed's instinct autobuyers", () => {
  it("is inert until unlocked", () => {
    const state = defaultState();
    state.souls = D(1000);
    tickAutobuyers(state); // no autobuyers unlocked -> nothing happens
    expect(state.stats.STR.trained.eq(0)).toBe(true);
  });

  it("gates unlock on Sin Essence and spends it", () => {
    const state = defaultState();
    state.sinEssence = D(2);
    expect(canUnlockAutobuyer(state, "auto-train")).toBe(false);
    state.sinEssence = D(3);
    expect(unlockAutobuyer(state, "auto-train")).toBe(true);
    expect(state.sinEssence.eq(0)).toBe(true);
    expect(state.autobuyers["auto-train"].unlocked).toBe(true);
    expect(state.autobuyers["auto-train"].enabled).toBe(true);
  });

  it("auto-train buys training each tick once unlocked and enabled", () => {
    const state = defaultState();
    state.sinEssence = D(3);
    unlockAutobuyer(state, "auto-train");
    state.souls = D(1000);
    tickAutobuyers(state);
    expect(state.stats.STR.trained.gt(0)).toBe(true);
  });

  it("respects the enabled toggle", () => {
    const state = defaultState();
    state.sinEssence = D(3);
    unlockAutobuyer(state, "auto-train");
    setAutobuyerEnabled(state, "auto-train", false);
    state.souls = D(1000);
    tickAutobuyers(state);
    expect(state.stats.STR.trained.eq(0)).toBe(true);
  });
});

describe("autobuyers run from the game loop", () => {
  it("a tick drives an unlocked auto-train", () => {
    // game.state is the live singleton; set it up for this assertion.
    game.state.sinEssence = D(3);
    unlockAutobuyer(game.state, "auto-train");
    game.state.souls = D(1000);
    const before = game.state.stats.STR.trained;
    tick(0.05);
    expect(game.state.stats.STR.trained.gte(before)).toBe(true);
    expect(game.state.stats.STR.trained.gt(0)).toBe(true);
  });
});
