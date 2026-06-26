import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { SINS, sinById } from "../src/content/sins";
import { skillById } from "../src/content/skills";
import { activeModifiers, NEUTRAL_MODIFIERS } from "../src/engine/modifiers";
import {
  canEnterTrial,
  checkTrialClear,
  enterTrial,
  exitTrial,
  isTrialCleared,
} from "../src/engine/sinTrial";
import { skillLevel } from "../src/engine/skills";
import { game, tick } from "../src/engine/game";

describe("sin content", () => {
  it("defines 7 sins whose rewards all resolve to real skills", () => {
    expect(SINS.length).toBe(7);
    for (const sin of SINS) {
      expect(skillById(sin.rewardSkillId)).not.toBeNull();
    }
  });
});

describe("modifiers context", () => {
  it("is neutral with no active trial", () => {
    const state = defaultState();
    expect(activeModifiers(state)).toEqual(NEUTRAL_MODIFIERS);
  });

  it("surfaces the active trial's constraint", () => {
    const state = defaultState();
    enterTrial(state, "wrath");
    expect(activeModifiers(state).hungerRateMult).toBe(2);
  });
});

describe("sin trial lifecycle", () => {
  it("entering activates the trial and resets the run", () => {
    const state = defaultState();
    state.souls = D(1000);
    state.totalKills = D(10);
    expect(canEnterTrial(state, "wrath")).toBe(true);
    expect(enterTrial(state, "wrath")).toBe(true);
    expect(state.activeTrial).toBe("wrath");
    expect(state.souls.eq(0)).toBe(true);
    expect(state.totalKills.eq(0)).toBe(true);
    // cannot enter another while one is active
    expect(canEnterTrial(state, "sloth")).toBe(false);
  });

  it("clears once on reaching the kill goal, grants the reward, and exits", () => {
    const state = defaultState();
    enterTrial(state, "wrath");
    state.totalKills = sinById("wrath")!.clearKills;
    expect(checkTrialClear(state)).toBe(true);
    expect(isTrialCleared(state, "wrath")).toBe(true);
    expect(state.activeTrial).toBeNull();
    expect(skillLevel(state, "wrath-ember")).toBe(1);

    // re-enter and clear again: reward is not granted twice
    enterTrial(state, "wrath");
    state.totalKills = sinById("wrath")!.clearKills;
    checkTrialClear(state);
    expect(skillLevel(state, "wrath-ember")).toBe(1);
  });

  it("abandoning a trial clears the active flag without a reward", () => {
    const state = defaultState();
    enterTrial(state, "sloth");
    exitTrial(state);
    expect(state.activeTrial).toBeNull();
    expect(isTrialCleared(state, "sloth")).toBe(false);
  });
});

describe("the game loop resolves a cleared trial", () => {
  it("a tick clears the active trial once the kill goal is met", () => {
    enterTrial(game.state, "wrath");
    game.state.totalKills = sinById("wrath")!.clearKills;
    tick(0.05);
    expect(game.state.activeTrial).toBeNull();
    expect(isTrialCleared(game.state, "wrath")).toBe(true);
    expect(skillLevel(game.state, "wrath-ember")).toBeGreaterThan(0);
  });
});
